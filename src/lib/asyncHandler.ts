import type { RequestHandler, Request, Response, NextFunction } from 'express';

export default (fn: RequestHandler) =>
	(req: Request, res: Response, next: NextFunction): any =>
		Promise
			.resolve(fn(req, res, next))
			.catch((e) => next(e));
