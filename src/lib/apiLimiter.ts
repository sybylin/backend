import rateLimit from 'express-rate-limit';
import { log } from 'lib/log';
import type { NextFunction, Request, Response } from 'express';

const apiLimiter = (process.env.NODE_ENV === 'production')
	? rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 500,
		standardHeaders: true,
		legacyHeaders: true,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		keyGenerator: (req, _res) => {
			if (req.ip === undefined)
				log.warn('`express-rate-limit` | `request.ip` of express is undefined');
			return (req.ip as string).replace(/:\d+[^:]*$/, '');
		}
	})
	: (_req: Request, _res: Response, next: NextFunction) => next();

export default apiLimiter;
