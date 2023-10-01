import { Router } from 'express';
import { success } from 'code/format';
import { jwtMiddleware } from 'lib/jwt';

import type { Request, Response, NextFunction } from 'express';

const successfulIdentification = (
	req: Request<any>,
	res: Response<any>,
	_next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
	return success(req, res, 'JW_101', {
		data: {
			userIsVerify: req.user.verify ?? false
		}
	}).res;
};

export default Router()
	.get('/user', jwtMiddleware.acceptUser, successfulIdentification)
	.get('/moderator', jwtMiddleware.acceptModerator, successfulIdentification)
	.get('/administrator', jwtMiddleware.acceptAdministrator, successfulIdentification);
