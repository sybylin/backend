import { token } from './jwtInterface';
import type { Response } from 'express';

export const JWT_COOKIE_NAME = 'access_token';
export const milliseconds = {
	one: 43200000,
	seven: 604800000
};

const sendCookieToResponse = (res: Response, jwtToken: token): void => {
	res.cookie(JWT_COOKIE_NAME, jwtToken.token, {
		domain: '',
		maxAge: (jwtToken.remember)
			? milliseconds.seven
			: milliseconds.one,
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production'
	});
};

export default sendCookieToResponse;
