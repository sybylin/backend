import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import UserController from 'database/user/controller';
import TokenController from 'database/token/controller';
import { log } from 'lib/log';
import { error } from 'src/code/format';
import getInfo from 'src/code';
import { JWT_COOKIE_NAME, milliseconds } from './jwtSendCookie';

import { Role } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';
import type { token } from './jwtInterface';
import type { CleanUser } from 'database/user/controller';

const JWT_TOKEN = '6ddfb1eb8c1c6c9598b3df7dcb9859aa8f25a58905a80a445d663d83db5f54be568886b0948271dd462449d11d29fcc4fb35751afce8fd19faf925bf5f5131f8ad11f0921c704df90fa967e98356d5e4f763fdac7f01a978877ea55f5e2ad778b458e168190d74d1cc6ad909ccd8bf645d1fef8ef7836ee11f7bb5f520fd437842274c8d3b1d2ccd6f1489d9baa9576fca62b71a9ae8cc729cffb810f92a94290675fb8a8117ffcc3afa72ea5deac4c40efbf14d2e43ecde91460cf5dd1af091a25695eebbb9a787612799da1dbe35b774417f5d78760af8ddb9f32160a86db53f819f3fb5af2242d00040ce9a50765bafedb09cbfa90096016e2927243d992b';

export const generateJwtToken = async (id: number, name: string, rememberMe = false): Promise<token> =>
	new Promise((res, rej) => {
		const xsrfToken = randomBytes(64).toString('base64');

		jwt.sign({
			id,
			name,
			xsrfToken
		},
		JWT_TOKEN,
		{
			algorithm: 'HS256',
			expiresIn: (rememberMe)
				? '7d'
				: '12h'
		}, (err, encoded) => {
			if (err || !encoded)
				rej(err);
			else {
				const deadline = new Date();

				deadline.setTime(
					new Date().getTime() + (
						rememberMe
							? milliseconds.seven
							: milliseconds.one
					)
				);
				TokenController.create({ user_id: id, token: encoded, deadline });
				res({
					token: encoded,
					xsrf: xsrfToken,
					remember: rememberMe
				});
			}
		});
	});

export const forceLogout = (req: Request, res: Response): Response<any, Record<string, any>> => {
	const authHeader = req.cookies[JWT_COOKIE_NAME] as string;

	if (authHeader) {
		TokenController.invalidateToken(authHeader)
			.catch(() => log.error('TokenController.invalidateToken failed'));
	}
	return res
		.clearCookie(JWT_COOKIE_NAME)
		.status(204)
		.send({ logout: true });
};

const verifyJwt = async (req: Request, res: Response, notGenError: boolean = false):
	Promise<{ error: true; logout?: true; res: Response<any, Record<string, any>> } | null> => {
	const xsrfTokenReq = req.headers['x-xsrf-token'] as string;
	const authHeader = req.cookies[JWT_COOKIE_NAME];
	const userIsPresent = !!req.user;
	const genError = () => !notGenError
		? error(req, res, 'JW_001', { status: 401 })
		: null;

	return new Promise((resolve) => {
		if (!xsrfTokenReq || !authHeader)
			return resolve(genError());
		jwt.verify(authHeader, JWT_TOKEN, async (err: any, decoded: any) => {
			if (err || !decoded || !decoded.name || decoded.xsrfToken !== xsrfTokenReq)
				return resolve({ error: true, logout: true, res: forceLogout(req, res) });
	
			const tokenIsValid = await TokenController.tokenIsValid(authHeader);
			if (!tokenIsValid)
				return resolve(genError());
			if (!userIsPresent) {
				const user = await UserController.cleanFindOne(decoded.name);
				if (!user)
					return resolve(genError());
				req.user = user;
			}
			return resolve(null);
		});
	});
};

export class jwtMiddleware {
	/**
	 * Include user to request if pass
	 */
	static includeUserIfPass(req: Request, res: Response, next: NextFunction): void {
		verifyJwt(req, res, true)
			.then(() => {
				if (!req.user)
					req.user = { id: -1, name: 'john doe' } as CleanUser;
				return next();
			})
			.catch(() => {
				if (!req.user)
					req.user = { id: -1, name: 'john doe' } as CleanUser;
				return next();
			});
	}

	/**
	 * Only users with the USER, MODERATOR or ADMINISTRATOR role will be accepted.
	 */
	static acceptUser(req: Request, res: Response, next: NextFunction): void {
		verifyJwt(req, res)
			.then((hasError) => {
				if (hasError)
					return hasError.res;
				if (
					req.user && (
						req.user.role === Role.USER ||
						req.user.role === Role.MODERATOR ||
						req.user.role === Role.ADMINISTRATOR
					)
				)
					return next();
				return error(req, res, 'JW_002', {status: 401, data: { role: req.user.role.toLowerCase() }}).res;
			})
			.catch((e) => {
				log.error(e);
				next(new Error(getInfo('GE_001').message));
			});
	}

	/**
	 * Only users with the MODERATOR or ADMINISTRATOR role will be accepted.
	 */
	static acceptModerator(req: Request, res: Response, next: NextFunction): void {
		verifyJwt(req, res)
			.then((hasError) => {
				if (hasError)
					return hasError.res;
				if (
					req.user && (
						req.user.role === Role.MODERATOR ||
						req.user.role === Role.ADMINISTRATOR
					)
				)
					return next();
				return error(req, res, 'JW_002', { status: 401, data: { role: req.user.role.toLowerCase() }}).res;
			})
			.catch((e) => {
				log.error(e);
				next(new Error(getInfo('GE_001').message));
			});
	}

	/**
	 * Only users with the ADMINISTRATOR role will be accepted.
	 */
	static acceptAdministrator(req: Request, res: Response, next: NextFunction): void {
		verifyJwt(req, res)
			.then((hasError) => {
				if (hasError)
					return hasError.res;
				if (req.user && req.user.role === Role.ADMINISTRATOR)
					return next();
				return error(req, res, 'JW_002', { status: 401, data: { role: req.user.role.toLowerCase() }}).res;
			})
			.catch((e) => {
				log.error(e);
				next(new Error(getInfo('GE_001').message));
			});
	}
}
