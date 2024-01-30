import 'database/db.instance';
import 'database/db.cron';
import error500 from './error500';
import apiLimiter from 'lib/apiLimiter';
import achievement from 'routes/achievement';
import enigma from 'routes/enigma';
import info from 'routes/defaultResponse';
import main from 'routes/main';
import rights from 'routes/rights';
import series from 'routes/series';
import user from 'routes/user';
import report from 'routes/report';
import type { Application, NextFunction, Request, Response } from 'express';

export default (app: Application): void => {
	app.use('/', apiLimiter, main);
	app.use('/achievement', apiLimiter, achievement);
	app.use('/enigmas', apiLimiter, enigma);
	app.use('/rights', apiLimiter, rights);
	app.use('/series', apiLimiter, series);
	app.use('/user', apiLimiter, user);
	app.use('/report', apiLimiter, report);

	/// 404
	app.use((req: Request, res: Response) => {
		res.status(404);
		if (req.accepts('json'))
			res.json(info(404));
		else
			res.type('txt').send(JSON.stringify(info(404), null, 2));
		res.send();
	});

	/// 500 JSON
	app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
		if (err instanceof SyntaxError && 'body' in err)
			return res.status(400).send({ message: err }).send();
		else
			next(err);
	});
	/// 500
	app.use(error500.middleware);
};
