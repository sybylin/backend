import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import UserController, { CleanUser } from 'database/user/controller';
import TokenController from 'database/token/controller';
import type { Request, Response, NextFunction } from 'express';
import getInfo from '@/code';

import { Role } from '@/routes/user/interface';
import { jwtToken } from './jwtInterface';
import type { token } from './jwtInterface';

export const JWT_COOKIE_NAME = 'access_token';
export const REMEMBER_COOKIE_NAME = 'remember_me';
const JWT_TOKEN = '6ddfb1eb8c1c6c9598b3df7dcb9859aa8f25a58905a80a445d663d83db5f54be568886b0948271dd462449d11d29fcc4fb35751afce8fd19faf925bf5f5131f8ad11f0921c704df90fa967e98356d5e4f763fdac7f01a978877ea55f5e2ad778b458e168190d74d1cc6ad909ccd8bf645d1fef8ef7836ee11f7bb5f520fd437842274c8d3b1d2ccd6f1489d9baa9576fca62b71a9ae8cc729cffb810f92a94290675fb8a8117ffcc3afa72ea5deac4c40efbf14d2e43ecde91460cf5dd1af091a25695eebbb9a787612799da1dbe35b774417f5d78760af8ddb9f32160a86db53f819f3fb5af2242d00040ce9a50765bafedb09cbfa90096016e2927243d992b';
const milliseconds = {
	one: 43200000,
	seven: 604800000
};

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

export const sendCookieToResponse = (res: Response, jwtToken: token): void => {
	res.cookie(JWT_COOKIE_NAME, jwtToken.token, {
		domain: '',
		maxAge: (jwtToken.remember)
			? milliseconds.seven
			: milliseconds.one,
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production'
	});
	if (jwtToken.remember) {
		res.cookie(REMEMBER_COOKIE_NAME, { 
			remember: jwtToken.remember,
			creationDate: new Date().toISOString()
		},
		{
			domain: '',
			maxAge: (jwtToken.remember)
				? milliseconds.seven
				: milliseconds.one,
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production'
		});
	}
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const forceLogout = (_req: Request, res: Response, next: NextFunction): void => {
	res
		.clearCookie(JWT_COOKIE_NAME)
		.clearCookie(REMEMBER_COOKIE_NAME)
		.status(204)
		.send();
};

export class jwtMiddleware {
	private static async verifyJwt(xsrfTokenReq: string, authHeader: string, userIsPresent = false): Promise<CleanUser | void> {
		return new Promise((res, rej) => {
			if (!xsrfTokenReq || !authHeader)
				return rej(jwtToken.unauthorized);
			jwt.verify(authHeader, JWT_TOKEN, async (err: any, decoded: any) => {
				if (err || !decoded || !decoded.name || decoded.xsrfToken !== xsrfTokenReq)
					return rej(jwtToken.forceLogout);

				const tokenIsValid = await TokenController.tokenIsValid(authHeader);
				if (!tokenIsValid)
					return rej(jwtToken.invalidToken);
				if (!userIsPresent) {
					const user = await UserController.cleanFindOne(decoded.name);
					if (!user)
						return rej(jwtToken.noUser);
					return res(user);
				}
				return res();
			});
		});
	}

	private static async base(req: Request, res: Response, next: NextFunction): Promise<void> {
		const user = await this.verifyJwt(
			req.headers['x-xsrf-token'] as string,
			req.cookies[JWT_COOKIE_NAME],
			!!req.user
		)
			.catch((e: jwtToken) => {
				if (e === jwtToken.forceLogout)
					forceLogout(req, res, next);
				else
					next(new Error(getInfo('JW_001').message));
			});
		if (!req.user)
			req.user = user as CleanUser;
	}

	/**
	 * Only users with the USER, MODERATOR or ADMINISTRATOR role will be accepted.
	 */
	static async acceptUser(req: Request, res: Response, next: NextFunction): Promise<void> {
		await this.base(req, res, next);
		if (!req.user)
			return next(new Error(getInfo('GE_001').message));
		if (
			req.user.role === Role.USER ||
			req.user.role === Role.MODERATOR ||
			req.user.role === Role.ADMINISTRATOR
		)
			return next();
		return next(new Error(getInfo('JW_002').message));
	}

	/**
	 * Only users with the MODERATOR or ADMINISTRATOR role will be accepted.
	 */
	static async acceptModerator(req: Request, res: Response, next: NextFunction): Promise<void> {
		await this.base(req, res, next);
		if (!req.user)
			return next(new Error(getInfo('GE_001').message));
		if (
			req.user.role === Role.MODERATOR ||
			req.user.role === Role.ADMINISTRATOR
		)
			return next();
		return next(new Error(getInfo('JW_002').message));
	}

	/**
	 * Only users with the ADMINISTRATOR role will be accepted.
	 */
	static async acceptAdministrator(req: Request, res: Response, next: NextFunction): Promise<void> {
		await this.base(req, res, next);
		if (!req.user)
			return next(new Error(getInfo('GE_001').message));
		if (req.user.role === Role.ADMINISTRATOR)
			return next();
		return next(new Error(getInfo('JW_002').message));
	}
}
