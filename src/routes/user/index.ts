import { Router } from 'express';
import isEmpty from 'validator/lib/isEmpty';
import isNumeric from 'validator/lib/isNumeric';
import normalizeEmail from 'validator/lib/normalizeEmail';
import { isString } from 'lodash';
import { getInfo } from 'code/index';
import { error, success } from 'code/format';
import { JWT_COOKIE_NAME, generateJwtToken, jwtMiddleware } from 'lib/jwt';
import mailSystem from 'lib/mail';
import UserController from 'database/user/controller';
import { verifyRequest, generateToken } from './utility';
import { initPasswordReset, resetPassword } from './resetPassword';

import type { NextFunction, Response } from 'express';
import type { UserRequest } from './interface';

class accountCRUD {
	static async create(req: UserRequest, res: Response<any>, next: NextFunction) {
		if (verifyRequest(req, res, true, true))
			return next();
		const mail = normalizeEmail(req.body.email);
		if (mail === false)
			return error(req, res, 'US_004');
		const token = generateToken();
		const account = await UserController.create({
			name: req.body.name,
			email: mail,
			role: 'USER',
			password: req.body.password as string,
			verify: false,
			token: token.token,
			token_deadline: token.deadline
		})
			.catch((e) => {
				if (e.code === 'P2002') {
					if (e.meta.target.includes('name'))
						return error(req, res, 'US_006');
					if (e.meta.target.includes('email'))
						return error(req, res, 'US_007');
				} else
					next(e);
			});

		if (!account || typeof account === 'boolean')
			return next(new Error(getInfo('GE_003').message));
		await mailSystem.accountVerification(mail, { token: token.token.toString() })
			.catch(() => next(new Error(getInfo('GE_002').message)));

		return success(req, res, 'US_104', {
			data: {
				user: {
					verify: false,
					timestamp: new Date().getTime()
				}
			}
		});
	}

	static async read(req: UserRequest, res: Response<any>, next: NextFunction) {
		if (verifyRequest(req, res, false, false))
			return next();
		return success(req, res, 'US_107', {
			data: {
				...(await UserController.cleanFindOne(req.body.name))
			}
		});
	}

	static async update(req: UserRequest, res: Response<any>, next: NextFunction) {
		if (verifyRequest(req, res, true, true))
			return next();
		const mail = normalizeEmail(req.body.email);
		if (mail === false)
			return error(req, res, 'US_004');
		const accountCheck = await UserController.check(req.body.name, req.body.password)
			.catch((e) => {
				if (e.code === 'P2002') {
					if (e.meta.target.includes('name'))
						return error(req, res, 'US_006');
					if (e.meta.target.includes('email'))
						return error(req, res, 'US_007');
				} else
					next(e);
			});
		if (!accountCheck)
			return error(req, res, 'US_001');
		const user = await UserController.findOne(req.body.name);
		if (!user)
			return error(req, res, 'GE_001');
		const token = generateToken();
		await UserController.update({
			id: user.id,
			name: req.body.name,
			email: mail ?? user.email,
			verify: !(mail),
			token: (mail)
				? token.token
				: null,
			token_deadline: (mail)
				? token.deadline
				: null,
			password: req.body.password as string ?? undefined
		}, !!(req.body.password))
			.catch(() => next(new Error(getInfo('GE_002').message)));
		mailSystem.accountVerification(mail, { token: String(token.token) })
			.catch(() => next(new Error(getInfo('GE_002').message)));
		return success(req, res, 'US_102', {
			data: {
				mailSend: true
			}
		});
	}

	static async delete(req: UserRequest, res: Response<any>, next: NextFunction) {
		if (verifyRequest(req, res, true, false))
			return next();
		const accountCheck = await UserController.check(req.body.name, req.body.password)
			.catch((e) => next(e));
		if (!accountCheck)
			return error(req, res, 'US_001');
		await UserController.delete(req.body.name)
			.catch((e) => next(e));
		return success(req, res, 'US_106', { data: { name: req.body.name } });
	}
}

class account extends accountCRUD {
	static async getUser(req: UserRequest, res: Response<any>, next: NextFunction) {
		if (!req.params.name)
			return error(req, res, 'RE_002', { data: { key: 'name' } });
		const user = await UserController.findOne(req.params.name)
			.catch(() => next(new Error(getInfo('GE_001').message)));
		if (!user)
			return error(req, res, 'US_001');
		return success(req, res, 'US_107', {
			data: {
				user: {
					name: user.name,
					avatar: user.avatar,
				}
			}
		});
	}

	static async checkUser(req: UserRequest, res: Response<any>, next: NextFunction) {
		if (verifyRequest(req, res, true, false))
			return next();
		const check = await UserController.check(req.body.name, req.body.password)
			.catch(() => next(new Error(getInfo('GE_001').message)));
		if (check === null || check === false) {
			return error(req, res,
				(typeof check !== 'boolean')
					? 'US_001'
					: 'US_002',
				{
					data: {
						userNotExist: (typeof check !== 'boolean'),
						incorrectPassword: (typeof check === 'boolean')
					}
				}
			);
		}
		const user = await UserController.cleanFindOne(req.body.name)
			.catch(() => next(new Error(getInfo('GE_001').message)));
		if (!user)
			return error(req, res, 'US_001');
		return success(req, res,
			'US_101',
			{
				data: {
					userNotExist: false,
					incorrectPassword: false
				}
			},
			await generateJwtToken(user.id, user.name, req.body.remember ?? false)
		);
	}

	static async token(req: UserRequest, res: Response<any>, next: NextFunction) {
		if (verifyRequest(req, res, false, false))
			return next();
		if (!req.body.token) {
			const user = await UserController.findOne(req.body.name)
				.catch(() => next(new Error(getInfo('GE_001').message)));
			if (!user || user.verify) {
				return error(req, res,
					(!user)
						? 'US_001'
						: 'US_003'
				);
			}
			const token = generateToken();
			user.verify = false;
			user.token = token.token;
			user.token_deadline = token.deadline;
			await UserController.update(user)
				.catch(() => next(new Error(getInfo('GE_001').message)));
			mailSystem.accountVerification(user.email, { token: String(user.token) })
				.catch(() => next(new Error(getInfo('GE_002').message)));
			return success(req, res, 'US_102', {
				data: {
					mailSend: true
				}
			});
		} else {
			if (isEmpty(String(req.body.token)))
				return error(req, res, 'RE_002', { data: { key: 'token' } });
			if (!isNumeric(String(req.body.token)) || String(req.body.token).length !== 8)
				return error(req, res, 'US_008');
			const user = await UserController.findOne(req.body.name)
				.catch(() => next(new Error(getInfo('GE_001').message)));
			if (!user || user.verify) {
				return error(req, res,
					(!user)
						? 'US_001'
						: 'US_003'
				);
			}
			const currentDate = new Date();
			if (!user.token_deadline)
				return next(new Error(getInfo('US_010').message));
			if (currentDate.getTime() > user.token_deadline.getTime())
				return error(req, res, 'US_009');
			if (user.token !== Number(req.body.token))
				return error(req, res, 'US_010');
			user.verify = true;
			await UserController.update(user)
				.catch(() => next(new Error(getInfo('GE_001').message)));
			return success(req, res, 'US_103');
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async logout(req: UserRequest, res: Response<any>, _next: NextFunction) {
		return res
			.clearCookie(JWT_COOKIE_NAME)
			.status(200)
			.send({ logout: true });
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static rememberMe(req: UserRequest, res: Response<any>, _next: NextFunction) {
		return success(req, res, 'US_108');
	}

	static async updateRole(req: UserRequest, res: Response<any>, next: NextFunction) {
		if (verifyRequest(req, res, false, false))
			return next();
		if (!req.body.role || isEmpty(req.body.role) || !isString(req.body.role))
			return error(req, res, 'RE_002', { data: { key: 'role' } });

		await UserController.updateRole(req.body.name, req.body.role)
			.catch(() => next(new Error(getInfo('GE_002').message)));
		return success(req, res, 'US_122', {
			data: {
				roleIsUpdate: true
			}
		});
	}
}

export default Router()
	.get('/check', jwtMiddleware.acceptUser, account.rememberMe)
	.get('/logout', jwtMiddleware.acceptUser, account.logout)
	.get('/user/:name', jwtMiddleware.acceptUser, account.getUser)

	.post('/create', account.create)
	.post('/check', account.checkUser)
	.post('/token', account.token)
	.post('/role', jwtMiddleware.acceptAdministrator, account.updateRole)
	.post('/reset/init', initPasswordReset)
	.post('/reset/update', resetPassword)

	.put('/', jwtMiddleware.acceptUser, account.update)

	.delete('/', jwtMiddleware.acceptUser, account.delete);
