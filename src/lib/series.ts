import SeriesController from 'database/series/controller';
import { log } from 'lib/log';
import { error } from 'src/code/format';
import getInfo from 'src/code';
import type { Request, Response, NextFunction } from 'express';

export const seriesIsPublished = (req: Request, res: Response, next: NextFunction): any => {
	if (!Object.keys(req.body).length)
		return error(req, res, 'RE_001').res;
	if (!req.body.series_id || typeof req.body.series_id !== 'number')
		return error(req, res, 'RE_002', { data: { key: 'series_id' } }).res;

	SeriesController.published(Number(req.body.series_id))
		.then((v) => {
			if (!v)
				return next();
			return error(req, res, 'SE_004', { status: 403, data: { role: req.user.role.toLowerCase() }}).res;
		})
		.catch((e) => {
			log.error(e);
			next(new Error(getInfo('GE_001').message));
		});
};
