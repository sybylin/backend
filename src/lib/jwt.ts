import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import UserController from 'database/user/controller';
import TokenController from 'database/token/controller';
import type { Request, Response, NextFunction } from 'express';

export type token = Record<'token' | 'xsrf' | 'remember', string | boolean>;
export type tokenContent = Record<'id' | 'name' | 'xsrfToken', string | number>

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
				TokenController.create({ token: encoded, deadline });
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
export const forceLogout = (_req: Request, res: Response, _next: NextFunction): void => {
	res
		.clearCookie(JWT_COOKIE_NAME)
		.clearCookie(REMEMBER_COOKIE_NAME)
		.status(204);
};

export const jwtMiddleware = (req: Request, res: Response, next: NextFunction): void => {
	const xsrfTokenReq = req.headers['x-xsrf-token'] as string;
	const authHeader = req.cookies[JWT_COOKIE_NAME];
	
	if (!xsrfTokenReq || !authHeader)
		res.sendStatus(401);
	else {
		jwt.verify(authHeader, JWT_TOKEN, async (err: any, decoded: any) => {
			if (err || !decoded || !decoded.name || decoded.xsrfToken !== xsrfTokenReq)
				return forceLogout(req, res, next);
			const tokenIsValid = await TokenController.tokenIsValid(authHeader);
			const user = await UserController.findOne(decoded.name);

			if (!user || !tokenIsValid)
				return res.sendStatus(401);
			req.user = user;
			next();
		});
	}
};
