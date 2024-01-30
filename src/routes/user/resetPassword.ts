import { randomBytes } from 'crypto';
import { isString } from 'lib/isSomething';
import isEmpty from 'validator/lib/isEmpty';
import isEmail from 'validator/lib/isEmail';
import normalizeEmail from 'validator/lib/normalizeEmail';
import getInfo from '@/code';
import mail from 'lib/mail';
import { error, success } from 'code/format';
import UserController from 'database/user/controller';
import UserResetPassword from 'database/userResetPassword/controller';
import { passwordIsMalformed } from './utility';

import type { NextFunction, Request, Response } from 'express';

interface InitPasswordRequest extends Request {
	body: {
		email: string;
		captcha: string;
	}
}

interface ResetPasswordRequest extends Request {
	body: {
		token: string;
		password: string;
		repeatPassword: string;
	}
}

/**
 * Init reset password system, need to pass name and email of user
 */
export const initPasswordReset = async (req: InitPasswordRequest, res: Response<any>, next: NextFunction): Promise<Response<any, Record<string, any>>> => {
	if (!Object.keys(req.body).length)
		return error(req, res, 'RE_001').res;
	if (!req.body.email || isEmpty(req.body.email) || !isEmail(req.body.email))
		return error(req, res, 'RE_002', { data: { key: 'email' } }).res;
	try {
		const norm = normalizeEmail(req.body.email);
		if (!norm)
			return error(req, res, 'US_005').res;
		const user = await UserController.findByEmail(norm);
		if (!user) {
			// fake for protect email analysis
			return success(req, res, 'US_120', {
				data: {
					initPasswordReset: true
				}
			}).res;
		}
		if (user.email.localeCompare(norm) !== 0)
			return error(req, res, 'US_005').res;
		const token = randomBytes(128).toString('base64url');
		const deadline = new Date();
		deadline.setTime(new Date().getTime() + 900000);
		const userReset = await UserResetPassword.create({
			user_id: user.id,
			deadline,
			token
		});
		if (!userReset)
			return error(req, res, 'US_020').res;
		mail.resetPassword(user.email, {
			url: (process.env.NODE_ENV === 'production')
				? `https://sybyl.in/user/reset/${token}`
				: `http://localhost:9100/user/reset/${token}`
		})
			.catch(() => next(new Error(getInfo('GE_002').message)));
	} catch (e) {
		next(new Error(getInfo('GE_001').message));
	}
	return success(req, res, 'US_120', {
		data: {
			initPasswordReset: true
		}
	}).res;
};

export const resetPassword = async (req: ResetPasswordRequest, res: Response<any>, next: NextFunction): Promise<Response<any, Record<string, any>>> => {
	if (!Object.keys(req.body).length)
		return error(req, res, 'RE_001').res;
	if (!req.body.token || isEmpty(req.body.token) || !isString(req.body.token))
		return error(req, res, 'RE_002', { data: { key: 'token' } }).res;
	if (!req.body.password || isEmpty(req.body.password) || !isString(req.body.password))
		return error(req, res, 'RE_002', { data: { key: 'password' } }).res;
	if (!req.body.repeatPassword || isEmpty(req.body.repeatPassword) || !isString(req.body.repeatPassword))
		return error(req, res, 'RE_002', { data: { key: 'repeatPassword' } }).res;
	if (passwordIsMalformed(req.body.password))
		return error(req, res, 'US_012', { data: { key: 'password' } }).res;
	
	let userResetToken = await UserResetPassword.findByToken(req.body.token);
	const currentDate = new Date().getTime();

	if (userResetToken && Array.isArray(userResetToken))
		userResetToken = userResetToken.findLast((e) => e.token === req.body.token && e.deadline.getTime() > currentDate) ?? null;
	if (userResetToken && userResetToken.deadline.getTime() < currentDate)
		userResetToken = null;

	if (!userResetToken) {
		return error(req, res, 'US_022', { data: {
			resetTokenIsInvalid: true
		}}).res;
	}

	if ((req.body.password as string).localeCompare(req.body.repeatPassword) !== 0) {
		return error(req, res, 'US_002', { data: {
			differentPassword: true
		}}).res;
	}
	
	if (!await UserController.updatePassword(userResetToken.user_id, req.body.password))
		return error(req, res, 'GE_001').res;

	mail.passwordUpdate(userResetToken.user.email)
		.catch(() => next(new Error(getInfo('GE_002').message)));
	UserResetPassword.deleteUserTokens(userResetToken.user_id);

	return success(req, res, 'US_121', {
		data: {
			passwordResetSuccess: true
		}
	}).res;
};
