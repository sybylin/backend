import { randomBytes } from 'crypto';
import isEmpty from 'validator/lib/isEmpty';
import isEmail from 'validator/lib/isEmail';
import normalizeEmail from 'validator/lib/normalizeEmail';
import getInfo from '@/code';
import mail from '@/lib/mail';
import { error, success } from 'code/format';
import UserController from 'database/user/controller';
import UserResetPassword from 'database/userResetPassword/controller';

import type { NextFunction, Request, Response } from 'express';

/**
 * Init reset password system, need to pass name and email of user
 */
export default async (req: Request<any>, res: Response<any>, next: NextFunction): Promise<void> => {
	if (!Object.keys(req.body).length)
		return error(req, res, 'RE_001');
	if (!req.body.name || isEmpty(req.body.name))
		return error(req, res, 'RE_002', { data: { key: 'name' } });
	if (!req.body.email || isEmpty(req.body.email) || !isEmail(req.body.email))
		return error(req, res, 'RE_002', { data: { key: 'email' } });
	try {
		const user = await UserController.findOne(req.body.name);
		if (!user)
			return error(req, res, 'US_001');
		if (user.email.localeCompare(normalizeEmail(req.body.email).toString()) !== 0)
			return error(req, res, 'US_005');
		const token = randomBytes(128).toString('base64url');
		const deadline = new Date();
		deadline.setTime(new Date().getTime() + 900000);
		const userCreate = await UserResetPassword.create({
			user_id: user.id,
			deadline,
			token
		});
		if (!userCreate)
			return error(req, res, 'US_020');
		await mail.resetPassword(user.email, {
			url: (process.env.NODE_ENV === 'production')
				? `https://sibyllin.app/reset/${token}`
				: `http://localhost:9100/reset/${token}`
		})
			.catch(() => next(new Error(getInfo('GE_002').message)));
		return success(req, res, 'US_120', {
			data: {
				passwordReset: true,
				validated: false
			}
		});
	} catch (e) {
		next(new Error(getInfo('GE_001').message));
	}
};
