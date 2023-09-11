import rateLimit from 'express-rate-limit';
import { log } from 'lib/log';
import 'database/db.instance';
import 'database/db.cron';
import info from 'routes/defaultResponse';
import main from 'routes/main';
import achievement from 'routes/achievement';
import enigma from 'routes/enigma';
import series from 'routes/series';
import user from 'routes/user';
import type { Application, NextFunction, Request, Response } from 'express';

const JSONerror = (
	err: Error,
	_req: Request<any>,
	res: Response<any>,
	next: NextFunction
) => {
	if (err instanceof SyntaxError && 'body' in err)
		return res.status(400).send({ message: err });
	next();
};

const error400 = (
	req: Request<any>,
	res: Response<any>
): void => {
	res.status(404);
	if (req.accepts('json'))
		res.json(info(404));
	else
		res.type('txt').send(JSON.stringify(info(404), null, 2));
};

const error500 = (
	err: Error,
	req: Request<any>,
	res: Response<any>,
	next: NextFunction
): void => {
	log.error(err);
	if (!res.headersSent) {
		res.status(500);
		if (req.accepts('json'))
			res.send({ info: err, statusCode: 500 });
		else
			res.send(JSON.stringify({ info: err, statusCode: 500 }, null, 2));
	}
	next();
};

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: true,
	keyGenerator: (req, _res) => { // eslint-disable-line @typescript-eslint/no-unused-vars
		if (!req.ip)
			log.warn('`express-rate-limit` | `request.ip` of express is undefined');
		return req.ip.replace(/:\d+[^:]*$/, '');
	}
});

export default (app: Application): void => {
	app.use('/', apiLimiter, main);
	app.use('/achievement', apiLimiter, achievement);
	app.use('/enigma', apiLimiter, enigma);
	app.use('/series', apiLimiter, series);
	app.use('/user', apiLimiter, user);

	app.use(JSONerror);
	app.use(error400);
	app.use(error500);
};
