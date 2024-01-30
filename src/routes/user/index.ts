/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import isEmail from 'validator/lib/isEmail';
import isEmpty from 'validator/lib/isEmpty';
import isNumeric from 'validator/lib/isNumeric';
import isLength from 'validator/lib/isLength';
import normalizeEmail from 'validator/lib/normalizeEmail';
import escape from 'validator/lib/escape';
import ltrim from 'validator/lib/ltrim';
import rtrim from 'validator/lib/rtrim';
import { isString } from 'lib/isSomething';
import { getInfo } from 'code/index';
import { error, success } from 'code/format';
import { generateJwtToken, jwtMiddleware } from 'lib/jwt';
import { JWT_COOKIE_NAME } from 'lib/jwtSendCookie';
import mailSystem from 'lib/mail';
import { log } from 'lib/log';
import { userProfil } from 'lib/upload';
import asyncHandler from 'lib/asyncHandler';
import { checkAchievement } from '@/achievement';
import TokenController from 'database/token/controller';
import UserController from 'database/user/controller';
import UserBlockedController from 'database/userBlocked/controller';
import { enumCheckUser } from 'database/user/controller';
import { verifyRequest, passwordIsMalformed, generateToken } from './utility';
import { initPasswordReset, resetPassword } from './resetPassword';
import checkProfanity from 'lib/profanityFilter';
import { captchaMiddleware } from 'lib/captcha';

import type { Request, NextFunction, Response } from 'express';

class accountCRUD {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async create(req: Request, res: Response, _next: NextFunction) {
		const hasError = verifyRequest(req, res, true, true);
		if (hasError)
			return hasError.res;
		if (checkProfanity(req.body.name, false) !== null)
			return error(req, res, 'US_031', { data: { key: 'name' } });
		if (!isLength(req.body.name, { min: 4, max: 255 }))
			return error(req, res, 'RE_002', { data: { key: 'name' } });
		if (passwordIsMalformed(req.body.password))
			return error(req, res, 'US_012', { data: { key: 'password' } });
		const mail = normalizeEmail(req.body.email);
		if (mail === false)
			return error(req, res, 'US_004').res;
		const token = generateToken();
		
		let account: { name: string; email: string } | null = null;
		try {
			account = await UserController.create({
				name: req.body.name,
				email: mail,
				role: 'USER',
				password: req.body.password as string,
				verify: false,
				last_connection: null,
				token: token.token,
				token_deadline: token.deadline
			});
		} catch (e: any) {
			if (e.code === 'P2002') {
				if (e.meta.target.includes('name'))
					return error(req, res, 'US_006').res;
				if (e.meta.target.includes('email'))
					return error(req, res, 'US_007').res;
			} else
				return error(req, res, 'GE_003', { data: { accountCreationFailed: true } });
		}
		
		if (!account || typeof account === 'boolean')
			return error(req, res, 'GE_003', { data: { accountCreationFailed: true } });
		try {
			await mailSystem.accountVerification(mail, { token: token.token.toString() });
		} catch {
			await UserController.delete(req.body.name);
			return error(req, res, 'GE_002', { data: { mailSystemFailed: true } });
		}

		return success(req, res, 'US_104', {
			data: {
				user: {
					verify: false,
					timestamp: new Date().getTime()
				}
			}
		}).res;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async read(req: Request, res: Response, _next: NextFunction) {
		const hasError = verifyRequest(req, res, false, false);
		if (hasError)
			return hasError.res;
		return success(req, res, 'US_107', {
			data: {
				...(await UserController.cleanFindOne(req.body.name))
			}
		}).res;
	}

	static async update(req: Request, res: Response, next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (
			!req.body.name ||
			!isString(req.body.name) ||
			isEmpty(req.body.name) ||
			!isLength(req.body.name, { min: 4, max: 255 })
		)
			return error(req, res, 'RE_002', { data: { key: 'name' } }).res;
			
		if (checkProfanity(req.body.name, false) !== null)
			return error(req, res, 'US_031', { data: { key: 'name' } });
		if (!req.body.email || !isString(req.body.email) || isEmpty(req.body.email))
			return error(req, res, 'RE_002', { data: { key: 'email' } }).res;
		if (!isEmail(req.body.email))
			return error(req, res, 'US_005').res;
		req.body.email = normalizeEmail(req.body.email);
		if (req.body.email === false)
			return error(req, res, 'US_004').res;

		const mailNotChanged = req.user.email.localeCompare(req.body.email) === 0;
		const passwordChanged = Object.prototype.hasOwnProperty.call(req.body, 'oldPassword')
			&& isString(req.body.oldPassword)
			&& Object.prototype.hasOwnProperty.call(req.body, 'newPassword')
			&& isString(req.body.newPassword);
		if (passwordChanged) {
			if (!req.body.oldPassword || !isString(req.body.oldPassword) || isEmpty(req.body.oldPassword))
				return error(req, res, 'RE_002', { data: { key: 'oldPassword' } });
			if (!req.body.newPassword || !isString(req.body.newPassword) || isEmpty(req.body.newPassword))
				return error(req, res, 'RE_002', { data: { key: 'newPassword' } });
			if (passwordIsMalformed(req.body.newPassword))
				return error(req, res, 'US_012', { data: { key: 'newPassword' } });
			if ((await UserController.check(req.user.id, req.body.oldPassword)).info === enumCheckUser.INCORRECT_PASSWORD)
				return error(req, res, 'US_002').res;
		}
		const token = generateToken();
		const newUser = await UserController.update({
			id: req.user.id,
			name: req.body.name,
			email: req.body.email,
			verify: mailNotChanged,
			token: (!mailNotChanged)
				? token.token
				: null,
			token_deadline: (!mailNotChanged)
				? token.deadline
				: null,
			password: (passwordChanged)
				? req.body.newPassword as string ?? undefined
				: req.body.password as string ?? undefined
		}, passwordChanged);
		if (!mailNotChanged)
			await mailSystem.accountVerification(req.body.email, { token: String(token.token) });

		return success(req, res, (!mailNotChanged)
			? 'US_102'
			: 'US_105',
		{
			data: {
				user: newUser,
				mailSend: !!mailNotChanged
			},
		},
		await generateJwtToken(req.user.id, newUser.name, false)
		).res;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async delete(req: Request, res: Response, _next: NextFunction) {
		await UserController.delete(req.user.id);
		return success(req, res, 'US_106', {
			data: {
				name: req.user.name
			}
		}).res;
	}
}

class account extends accountCRUD {
	static async getUser(req: Request, res: Response, next: NextFunction) {
		if (!req.params.name)
			return error(req, res, 'RE_002', { data: { key: 'name' } }).res;
		const user = await UserController.findOne(req.params.name);
		if (!user)
			return error(req, res, 'US_001').res;
		return success(req, res, 'US_107', {
			data: {
				user: {
					name: user.name,
					avatar: user.avatar,
				}
			}
		}).res;
	}

	static async getHisInfo(req: Request, res: Response, _next: NextFunction) {
		return success(req, res, 'US_107', {
			data: {
				user: req.user
			}
		});
	}

	static async getHisRole(req: Request, res: Response, _next: NextFunction) {
		return success(req, res, 'US_107', {
			data: {
				role: req.user.role
			}
		});
	}

	static async getAllHisInfo(req: Request, res: Response, _next: NextFunction) {
		return success(req, res, 'US_107', {
			data: {
				user: await UserController.cleanFindOneFull(req.user.id)
			}
		});
	}

	static async checkUser(req: Request, res: Response, _next: NextFunction) {
		const hasError = verifyRequest(req, res, true, false);
		if (hasError)
			return hasError.res;
		
		const check = await UserController.check(req.body.name, req.body.password);
		if (check.info !== enumCheckUser.OK) {
			const err = () => {
				if (check.info === enumCheckUser.INCORRECT_PASSWORD)
					return 'US_002';
				if (check.info === enumCheckUser.NOT_FOUND)
					return 'US_001';
				return 'GE_001';
			};

			if (check.info === enumCheckUser.ERROR)
				log.error(check.data);
			return error(req, res, err(), {
				data: {
					userNotExist: check.info === enumCheckUser.NOT_FOUND,
					incorrectPassword: check.info === enumCheckUser.INCORRECT_PASSWORD
				}
			}).res;
		}

		const user = await UserController.cleanFindOne(req.body.name);
		if (!user)
			return error(req, res, 'US_001').res;
		req.user = user;
		await checkAchievement(req, res, 'firstConnection', { user_id: user.id, latest_connection_date: (check.data as any).last_connection });
		return success(req, res,
			'US_101',
			{
				data: {
					userNotExist: false,
					incorrectPassword: false
				}
			},
			await generateJwtToken(user.id, user.name, req.body.remember ?? false)
		).res;
	}

	static async token(req: Request, res: Response, next: NextFunction) {
		const hasError = verifyRequest(req, res, false, false);
		if (hasError)
			return hasError.res;
		if (!req.body.token) {
			const user = await UserController.findOne(req.body.name);
			if (!user || user.verify) {
				return error(req, res,
					(!user)
						? 'US_001'
						: 'US_003'
				).res;
			}
			const token = generateToken();
			user.verify = false;
			user.token = token.token;
			user.token_deadline = token.deadline;
			await UserController.update(user, false);

			await mailSystem.accountVerification(user.email, { token: String(user.token) });
			return success(req, res, 'US_102', { data: { mailSend: true } }).res;
		} else {
			if (isEmpty(String(req.body.token)))
				return error(req, res, 'RE_002', { data: { key: 'token' } }).res;
			if (!isNumeric(String(req.body.token)) || String(req.body.token).length !== 8)
				return error(req, res, 'US_008').res;
			const user = await UserController.findOne(req.body.name);
			if (!user || user.verify) {
				return error(req, res,
					(!user)
						? 'US_001'
						: 'US_003'
				).res;
			}
			const currentDate = new Date();
			if (!user.token_deadline)
				return next(new Error(getInfo('US_010').message));
			if (currentDate.getTime() > user.token_deadline.getTime())
				return error(req, res, 'US_009').res;
			if (user.token !== Number(req.body.token))
				return error(req, res, 'US_010').res;
			user.verify = true;
			await UserController.update(user, false);
			return success(req, res, 'US_103').res;
		}
	}

	static async logout(req: Request, res: Response, next: NextFunction) {
		const authHeader = req.cookies[JWT_COOKIE_NAME] as string;

		if (authHeader) {
			await TokenController.invalidateToken(authHeader)
				.catch(() => next(new Error(getInfo('GE_001').message)));
		}
		return res
			.clearCookie(JWT_COOKIE_NAME)
			.status(200)
			.send({ logout: true });
	}

	static async updateRole(req: Request, res: Response, next: NextFunction) {
		if (!req.body.id || typeof req.body.id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'id' } }).res;
		if (!req.body.role || isEmpty(req.body.role) || !isString(req.body.role))
			return error(req, res, 'RE_002', { data: { key: 'role' } }).res;
		if (req.body.id === req.user.id)
			return error(req, res, 'US_030').res;
		await UserController.updateRole(req.body.id, req.body.role);
		return success(req, res, 'US_122', {
			data: {
				roleIsUpdate: true
			}
		}).res;
	}

	static async updateBlock(req: Request, res: Response, next: NextFunction) {
		if (!req.body.id || typeof req.body.id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'id' } }).res;
		if (req.body.id === req.user.id)
			return error(req, res, 'US_030').res;
		if (req.body.date) {
			return success(req, res, 'US_122', {
				data: {
					userBlocked: await UserBlockedController.create({
						user_id: Number(req.body.id),
						blocked_by: req.user.id,
						end_date: req.body.date
					}) !== null
				}
			}).res;
		}
		return success(req, res, 'US_122', {
			data: {
				userBlocked: await UserBlockedController.delete(Number(req.body.id))
			}
		}).res;
	}

	static async getPoints(req: Request, res: Response, _next: NextFunction) {
		return success(req, res, 'US_107', {
			data: {
				points: await UserController.getPoints(req.user.id)
			}
		}).res;
	}

	static async getUserList(req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.sort || typeof req.body.sort !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'sort' } }).res;
		if (req.body.last_element && typeof req.body.last_element !== 'string')
			return error(req, res, 'RE_002', { data: { key: 'last_id' } }).res;
		if (req.body.search && !isString(req.body.search))
			return error(req, res, 'RE_002', { data: { key: 'string' } }).res;
		const sort = (): { key: 'name' | 'creation_date', value: 'ASC' | 'DESC' } => {
			if (!req.body.sort)
				return { key: 'name', value: 'ASC' };
			switch (Number(req.body.sort)) {
			case 2:
				return { key: 'name', value: 'DESC' };
			case 3:
				return { key: 'creation_date', value: 'ASC' };
			case 4:
				return { key: 'creation_date', value: 'DESC' };
			case 1:
			default:
				return { key: 'name', value: 'ASC' };
			}
		};

		return success(req, res, 'US_131', {
			data: {
				users: await UserController.cleanFindAll(
					sort(),
					req.body.last_element ?? null,
					req.body.search
						? rtrim(ltrim(escape(req.body.search + '')))
						: undefined
				)
			}
		});
	}
}

export default Router()
	.get('/', jwtMiddleware.acceptUser, asyncHandler(account.getHisInfo))
	.get('/role', jwtMiddleware.acceptUser, asyncHandler(account.getHisRole))
	.get('/all', jwtMiddleware.acceptUser, asyncHandler(account.getAllHisInfo))
	.get('/points', jwtMiddleware.acceptUser, asyncHandler(account.getPoints))
	.get('/logout', jwtMiddleware.acceptUser, asyncHandler(account.logout))

	.post('/block', jwtMiddleware.acceptAdministrator, asyncHandler(account.updateBlock))
	.post('/create', captchaMiddleware, asyncHandler(account.create))
	.post('/check', asyncHandler(account.checkUser))
	.post('/list', jwtMiddleware.acceptAdministrator, asyncHandler(account.getUserList))
	.post('/token', asyncHandler(account.token))
	.post('/role', jwtMiddleware.acceptAdministrator, asyncHandler(account.updateRole))
	.post('/reset/init', captchaMiddleware, asyncHandler(initPasswordReset))
	.post('/reset/update', asyncHandler(resetPassword))

	.put('/', jwtMiddleware.acceptUser, asyncHandler(account.update))
	.put('/image',
		jwtMiddleware.acceptUser,
		userProfil.middleware.single('image'),
		asyncHandler(userProfil.check)
	)

	.delete('/', jwtMiddleware.acceptUser, asyncHandler(account.delete));
