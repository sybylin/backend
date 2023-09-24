import { jwtMiddleware } from '@/lib/jwt';
import { Router } from 'express';
import { isString } from 'lodash';
import isEmpty from 'validator/lib/isEmpty';
import { error, success } from 'code/format';
import SeriesController from 'database/series/controller';
import type { Request, Response, NextFunction } from 'express';
import type { Series } from '@prisma/client';

interface SerieCreateRequest extends Request {
	body: {
		title: string;
		description: string;
	}
}

class series {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async create(req: SerieCreateRequest, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.title || !isString(req.body.title) || isEmpty(req.body.title))
			return error(req, res, 'RE_002', { data: { key: 'title' } }).res;
		if (!req.body.description || !isString(req.body.description) || isEmpty(req.body.description))
			return error(req, res, 'RE_002', { data: { key: 'description' } }).res;

		let serie: Series | null = null;
		try {
			serie = await SeriesController.create({
				title: req.body.title,
				description: req.body.description,
			});
		} catch (e: any) {
			if (e.code === 'P2002') {
				if (e.meta.target.includes('title'))
					return error(req, res, 'US_006').res;
			} else
				return error(req, res, 'GE_003', { data: { serieCreationFailed: true } });
		}
		if (!serie || typeof serie === 'boolean')
			return error(req, res, 'GE_003', { data: { serieCreationFailed: true } });
		return success(req, res, 'US_104', {
			data: {
				serie
			}
		}).res;
	}

	static async read(req: Request, res: Response, next: NextFunction) {

	}

	static async update(req: Request, res: Response, next: NextFunction) {
		
	}

	static async delete(req: Request, res: Response, next: NextFunction) {
		
	}
}

export default Router()
	.post('/create', jwtMiddleware.acceptUser, series.create);
