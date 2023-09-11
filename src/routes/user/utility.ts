import { randomInt } from 'crypto';
import isEmail from 'validator/lib/isEmail';
import isEmpty from 'validator/lib/isEmpty';
import { isString } from 'lodash';
import { error } from 'code/format';

import type { Response } from 'express';
import type { UserRequest } from './interface';

export const verifyRequest = (
	req: UserRequest,
	res: Response<any>,
	checkPass = true,
	checkMail = false
): void => {
	if (!Object.keys(req.body).length)
		return error(req, res, 'RE_001');
	if (!req.body.name || isEmpty(req.body.name) || !isString(req.body.name))
		return error(req, res, 'RE_002', { data: { key: 'name' } });
	if (checkPass) {
		if (!req.body.password || isEmpty(req.body.password) || !isString(req.body.password))
			return error(req, res, 'RE_002', { data: { key: 'password' } });
	}
	if (checkMail) {
		if (!req.body.email || isEmpty(req.body.email) || !isString(req.body.email))
			return error(req, res, 'RE_002', { data: { key: 'email' } });
		if (!isEmail(req.body.email))
			return error(req, res, 'US_005');
	}
};

export const generateToken = (): { token: number; deadline: Date; } => {
	const date = new Date();
	date.setTime(date.getTime() + 900000);
	return {
		token: randomInt(10000000, 100000000), // 8 digits code
		deadline: date
	};
};
