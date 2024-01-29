/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { success } from 'code/format';
import asyncHandler from 'lib/asyncHandler';
import CaptchaInstance from 'lib/captcha';
import { jwtMiddleware } from 'lib/jwt';
import type { Request, Response, NextFunction } from 'express';

const successfulIdentification = (
	req: Request,
	res: Response,
	_next: NextFunction
) => {
	return success(req, res, 'JW_101', {
		data: {
			verify: req.user.verify ?? false,
			role: req.user.role.toLowerCase()
		}
	}).res;
};

const captchaCreate = async (
	_req: Request,
	res: Response,
	_next: NextFunction
) => {
	return res.status(200)
		.json(await CaptchaInstance.create())
		.send();
};

export default Router()
	.get('/user', jwtMiddleware.acceptUser, successfulIdentification)
	.get('/moderator', jwtMiddleware.acceptModerator, successfulIdentification)
	.get('/administrator', jwtMiddleware.acceptAdministrator, successfulIdentification)
	.get('/captcha', asyncHandler(captchaCreate));
