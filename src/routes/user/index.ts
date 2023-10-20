/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import isEmpty from 'validator/lib/isEmpty';
import isNumeric from 'validator/lib/isNumeric';
import normalizeEmail from 'validator/lib/normalizeEmail';
import { isString } from 'lodash';
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
import { enumCheckUser } from 'database/user/controller';
import { verifyRequest, generateToken } from './utility';
import { initPasswordReset, resetPassword } from './resetPassword';

import type { NextFunction, Response } from 'express';
import type { User } from '@prisma/client';
import type { UserRequest } from './interface';

class accountCRUD {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async create(req: UserRequest, res: Response<any>, _next: NextFunction) {
		const hasError = verifyRequest(req, res, true, true);
		if (hasError)
			return hasError.res;
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
	static async read(req: UserRequest, res: Response<any>, _next: NextFunction) {
		const hasError = verifyRequest(req, res, false, false);
		if (hasError)
			return hasError.res;
		return success(req, res, 'US_107', {
			data: {
				...(await UserController.cleanFindOne(req.body.name))
			}
		}).res;
	}

	static async update(req: UserRequest, res: Response<any>, next: NextFunction) {
		const hasError = verifyRequest(req, res, true, true);
		if (hasError)
			return hasError.res;
		const mail = normalizeEmail(req.body.email);
		if (mail === false)
			return error(req, res, 'US_004').res;

		let accountCheck: { data: unknown; info: enumCheckUser } | null = null;
		let user: User | null = null;
		try {
			accountCheck = await UserController.check(req.body.name, req.body.password);
		} catch (e: any) {
			if (e.code === 'P2002') {
				if (e.meta.target.includes('name'))
					return error(req, res, 'US_006').res;
				if (e.meta.target.includes('email'))
					return error(req, res, 'US_007').res;
			} else
				return next(e);
		}
		if (!accountCheck)
			return error(req, res, 'US_001').res;

		try {
			user = await UserController.findOne(req.body.name);
		} catch {
			return error(req, res, 'GE_002').res;
		}
		if (!user)
			return error(req, res, 'GE_001').res;

		const token = generateToken();
		try {
			await UserController.update({
				id: user.id,
				name: req.body.name,
				email: mail ?? user.email,
				verify: !(mail),
				last_connection: user.last_connection,
				token: (mail)
					? token.token
					: null,
				token_deadline: (mail)
					? token.deadline
					: null,
				password: req.body.password as string ?? undefined
			}, !!(req.body.password));
			mailSystem.accountVerification(mail, { token: String(token.token) });
		} catch {
			return next(new Error(getInfo('GE_002').message));
		}

		return success(req, res, 'US_102', {
			data: {
				mailSend: true
			}
		}).res;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async delete(req: UserRequest, res: Response<any>, _next: NextFunction) {
		const hasError = verifyRequest(req, res, true, false);
		if (hasError)
			return hasError.res;
		if (!await UserController.check(req.body.name, req.body.password))
			return error(req, res, 'US_001').res;
		await UserController.delete(req.body.name);
		return success(req, res, 'US_106', {
			data: {
				name: req.body.name
			}
		}).res;
	}
}

class account extends accountCRUD {
	static async getUser(req: UserRequest, res: Response<any>, next: NextFunction) {
		if (!req.params.name)
			return error(req, res, 'RE_002', { data: { key: 'name' } }).res;
		const user = await UserController.findOne(req.params.name)
			.catch(() => next(new Error(getInfo('GE_001').message)));
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async getHisInfo(req: UserRequest, res: Response<any>, _next: NextFunction) {
		if (req.user) {
			return success(req, res, 'US_107', {
				data: {
					user: req.user
				}
			});
		}
		return error(req, res, 'US_001');
	}

	static async checkUser(req: UserRequest, res: Response<any>, _next: NextFunction) {
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

	static async token(req: UserRequest, res: Response<any>, next: NextFunction) {
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
			await UserController.update(user);

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
			await UserController.update(user);
			return success(req, res, 'US_103').res;
		}
	}

	static async logout(req: UserRequest, res: Response<any>, next: NextFunction) {
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

	static async updateRole(req: UserRequest, res: Response<any>, next: NextFunction) {
		const hasError = verifyRequest(req, res, false, false);
		if (hasError)
			return hasError.res;
		if (!req.body.role || isEmpty(req.body.role) || !isString(req.body.role))
			return error(req, res, 'RE_002', { data: { key: 'role' } }).res;

		await UserController.updateRole(req.body.name, req.body.role)
			.catch(() => next(new Error(getInfo('GE_002').message)));
		return success(req, res, 'US_122', {
			data: {
				roleIsUpdate: true
			}
		}).res;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async getPoints(req: UserRequest, res: Response<any>, _next: NextFunction) {
		if (req.user) {
			return success(req, res, 'US_107', {
				data: {
					points: await UserController.getPoints(req.user.id)
				}
			}).res;
		}
		return error(req, res, 'US_001');
	}
}

export default Router()
	.get('/', jwtMiddleware.acceptUser, asyncHandler(account.getHisInfo))
	.get('/points', jwtMiddleware.acceptUser, asyncHandler(account.getPoints))
	.get('/logout', jwtMiddleware.acceptUser, asyncHandler(account.logout))
	.get('/get/:name', jwtMiddleware.acceptUser, asyncHandler(account.getUser))

	.post('/create', asyncHandler(account.create))
	.post('/check', asyncHandler(account.checkUser))
	.post('/token', asyncHandler(account.token))
	.post('/role', jwtMiddleware.acceptAdministrator, asyncHandler(account.updateRole))
	.post('/reset/init', asyncHandler(initPasswordReset))
	.post('/reset/update', asyncHandler(resetPassword))

	.put('/', jwtMiddleware.acceptUser, asyncHandler(account.update))
	.put('/image',
		jwtMiddleware.acceptUser,
		userProfil.middleware.single('image'),
		asyncHandler(userProfil.check)
	)

	.delete('/', jwtMiddleware.acceptUser, asyncHandler(account.delete));
