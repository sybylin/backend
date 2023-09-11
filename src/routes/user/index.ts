import { randomInt } from 'crypto';
import { Router } from 'express';
import isEmail from 'validator/lib/isEmail';
import isEmpty from 'validator/lib/isEmpty';
import isNumeric from 'validator/lib/isNumeric';
import normalizeEmail from 'validator/lib/normalizeEmail';

import { getInfo } from 'code/index';
import { error, success } from 'code/format';
import { JWT_COOKIE_NAME, generateJwtToken, jwtMiddleware } from 'lib/jwt';
import Mail from 'lib/mail';
import UserController from 'database/user/controller';
import { initPasswordReset, resetPassword } from './resetPassword';

import type { NextFunction, Request, Response } from 'express';

export const Role = {
	USER: 'USER',
	MODERATOR: 'MODERATOR',
	ADMINISTRATOR: 'ADMINISTRATOR'
};
export type Role = (typeof Role)[keyof typeof Role]

const generateToken = (): { token: number; deadline: Date } => {
	const date = new Date();
	date.setTime(date.getTime() + 900000);
	return {
		token: randomInt(10000000, 100000000), // 8 digits code
		deadline: date
	};
};

const VerifUserPass = (req: Request<any>, res: Response<any>, checkPass = true) => {
	if (!Object.keys(req.body).length)
		return error(req, res, 'RE_001');
	if (!req.body.name || isEmpty(req.body.name))
		return error(req, res, 'RE_002', { data: { key: 'name' } });
	if (checkPass) {
		if (!req.body.password || isEmpty(req.body.password))
			return error(req, res, 'RE_002', { data: { key: 'password' } });
	}
};

class account {
	static get(req: Request<any>, res: Response<any>, next: NextFunction) {
		if (!req.params.length)
			return error(req, res, 'RE_002', { data: { key: 'name' } });
		UserController.findOne(req.params.name)
			.then((d) => {
				if (!d)
					return error(req, res, 'US_001');
				return success(req, res, 'US_107', {
					data: {
						user: {
							name: d?.name,
							avatar: d?.avatar,
						}
					}
				});
			})
			.catch(() => next(new Error(getInfo('GE_001').message)));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static rememberMe(req: Request<any>, res: Response<any>, _next: NextFunction) {
		return success(req, res, 'US_108');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static logout(_req: Request<any>, res: Response<any>, _next: NextFunction) {
		return res
			.clearCookie(JWT_COOKIE_NAME)
			.status(200)
			.send({ logout: true });
	}

	static check(req: Request<any>, res: Response<any>, next: NextFunction) {
		VerifUserPass(req, res);
		UserController.check(req.body.name, req.body.password)
			.then(async (check) => {
				if (check === null) {
					return success(req, res, 'US_001', {
						data: {
							userNotExist: true,
							incorrectPassword: false
						}
					});
				}
				if (check === false) {
					return success(req, res, 'US_002', {
						data: {
							userNotExist: false,
							incorrectPassword: true
						}
					});
				}
				const user = await UserController.findOne(req.body.name);
				if (!user)
					throw new Error('no user');
				return success(req, res, 'US_101', {
					data: {
						userNotExist: false,
						incorrectPassword: false
					},
				},
				await generateJwtToken(user.id, user.name, req.body.remember ?? false));
			})
			.catch(() => next(new Error(getInfo('GE_001').message)));
	}

	static token(req: Request<any>, res: Response<any>, next: NextFunction) {
		VerifUserPass(req, res, false);
		if (!req.body.token) {
			UserController.findOne(req.body.name)
				.then((d) => {
					if (!d)
						return error(req, res, 'US_001');
					if (d.verify)
						return error(req, res, 'US_003');
					const token = generateToken();
					d.verify = false;
					d.token = token.token;
					d.token_deadline = token.deadline;
					UserController.update(d)
						.then(() => {
							Mail.accountVerification(d.email, { token: String(d.token) })
								.then(() => success(req, res, 'US_102', {
									data: {
										mailSend: true
									}
								}))
								.catch(() => next(new Error(getInfo('GE_002').message)));
						})
						.catch((e) => next(e));
				})
				.catch((e) => next(e));
		} else {
			if (isEmpty(String(req.body.token)))
				return error(req, res, 'RE_002', { data: { key: 'token' } });
			if (!isNumeric(String(req.body.token)) || String(req.body.token).length !== 8)
				return error(req, res, 'RE_007');
			UserController.findOne(req.body.name)
				.then((d) => {
					if (!d)
						return error(req, res, 'US_001');
					if (d.verify)
						return error(req, res, 'US_003');
					const currentDate = new Date();
					if (d.token_deadline) {
						if (currentDate.getTime() > d.token_deadline.getTime())
							return error(req, res, 'US_009');
						if (d.token !== Number(req.body.token))
							return error(req, res, 'US_010');
						d.verify = true;
						UserController.update(d)
							.then(() => success(req, res, 'US_103'))
							.catch((e) => next(e));
					} else
						next(new Error(getInfo('US_010').message));
				})
				.catch((e) => next(e));
		}
	}

	static create(req: Request<any>, res: Response<any>, next: NextFunction) {
		VerifUserPass(req, res);
		if (!req.body.email || isEmpty(req.body.email))
			return error(req, res, 'RE_002', { data: { key: 'email' } });
		if (!isEmail(req.body.email))
			return error(req, res, 'US_005');
		const mail = normalizeEmail(req.body.email);
		if (mail === false)
			return error(req, res, 'US_004');
		
		const token = generateToken();
		UserController.create({
			id: 0,
			name: req.body.name,
			email: mail,
			role: 'USER',
			avatar: null,
			password: req.body.password,
			verify: false,
			token: token.token,
			token_deadline: token.deadline,
			creation_date: null,
			modification_date: null
		})
			.then((account) => {
				if (!account)
					return next(new Error(getInfo('GE_003').message));
				
				Mail.accountVerification(mail, { token: token.token.toString() })
					.then(async () => {
						return success(req, res, 'US_104', {
							data: {
								user: {
									name: account.name,
									email: account.email,
									verify: false,
									timestamp: new Date().getTime()
								}
							}
						});
					})
					.catch(() => next(new Error(getInfo('GE_002').message)));
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
	}

	static update(req: Request<any>, res: Response<any>, next: NextFunction) {
		VerifUserPass(req, res);
		if (!isEmail(req.body.email))
			return error(req, res, 'US_005');
		const mail = normalizeEmail(req.body.email);
		if (mail === false)
			return error(req, res, 'US_004');
		UserController.check(req.body.name, req.body.password)
			.then(async (check) => {
				console.log(check);
				if (!check)
					return error(req, res, 'US_001');
				const user = await UserController.findOne(req.body.name);
				if (user) {
					const token = generateToken();
					UserController.update({
						id: user.id,
						name: req.body.name,
						email: mail ?? user.email,
						verify: !(mail),
						role: req.body.user ?? 'USER',
						token: (mail)
							? token.token
							: null,
						token_deadline: (mail)
							? token.deadline
							: null,
						avatar: req.body.avatar ?? undefined,
						password: req.body.password ?? undefined,
						creation_date: null,
						modification_date: null
					}, !!(req.body.password))
						.then(() => {
							Mail.accountVerification(mail, { token: String(token.token) })
								.then(() => success(req, res, 'US_102', {
									data: {
										mailSend: true
									}
								}))
								.catch(() => next(new Error(getInfo('GE_002').message)));
						})
						.catch(() => next(new Error(getInfo('GE_002').message)));
				}
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
	}

	static delete(req: Request<any>, res: Response<any>, next: NextFunction) {
		VerifUserPass(req, res);
		UserController.check(req.body.name, req.body.password)
			.then(async (check) => {
				if (!check)
					return error(req, res, ('US_001'));
				UserController.delete(req.body.name)
					.then(() => success(req, res,'US_106'))
					.catch((e) => next(e));
			})
			.catch((e) => next(e));
	}
}

export default Router()
	.get('/check', jwtMiddleware, account.rememberMe)
	.get('/logout', jwtMiddleware, account.logout)
	.get('/reset/init', initPasswordReset)
	.get('/reset/update', resetPassword)
	.get('/:name', jwtMiddleware, account.get)

	.post('/create', account.create)
	.post('/check', account.check)
	.post('/token', account.token)

	.put('/', jwtMiddleware, account.update)
	
	.delete('/', jwtMiddleware, account.delete);
