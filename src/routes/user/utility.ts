import { randomInt } from 'crypto';
import isEmail from 'validator/lib/isEmail';
import isEmpty from 'validator/lib/isEmpty';
import { isString } from 'lib/isSomething';
import { error, returnFormat } from 'code/format';
import type { Response } from 'express';
import type { UserRequest } from './interface';

export const verifyRequest = (
	req: UserRequest,
	res: Response<any>,
	checkPass = true,
	checkMail = false
): returnFormat | null => {
	if (!Object.keys(req.body).length)
		return error(req, res, 'RE_001');
	if (!req.body.name || !isString(req.body.name) || isEmpty(req.body.name))
		return error(req, res, 'RE_002', { data: { key: 'name' } });
	if (checkPass) {
		if (!req.body.password || !isString(req.body.password) || isEmpty(req.body.password))
			return error(req, res, 'RE_002', { data: { key: 'password' } });
	}
	if (checkMail) {
		if (!req.body.email || !isString(req.body.email) || isEmpty(req.body.email))
			return error(req, res, 'RE_002', { data: { key: 'email' } });
		if (!isEmail(req.body.email))
			return error(req, res, 'US_005');
	}
	return null;
};

export const passwordIsMalformed = (password: string): boolean => (
	(password.length < 8 || password.length > 255) ||
		!/[a-z]/.test(password) ||
		!/[A-Z]/.test(password) ||
		!/[0-9]/.test(password) ||
		!/[!"#$%&'()*+,-./:;<=>?@[\\\\\\\]^_` {|}~]/.test(password)
);

export const generateToken = (): { token: number; deadline: Date; } => {
	const date = new Date();
	date.setTime(date.getTime() + 900000);
	return {
		token: randomInt(10000000, 100000000), // 8 digits code
		deadline: date
	};
};
