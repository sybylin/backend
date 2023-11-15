/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { success } from 'code/format';
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

export default Router()
	.get('/user', jwtMiddleware.acceptUser, successfulIdentification)
	.get('/moderator', jwtMiddleware.acceptModerator, successfulIdentification)
	.get('/administrator', jwtMiddleware.acceptAdministrator, successfulIdentification);
