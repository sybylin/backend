/* eslint-disable @typescript-eslint/no-unused-vars */
import { jwtMiddleware } from '@/lib/jwt';
import { Router } from 'express';
import { isNumber, isString } from 'lodash';
import isEmpty from 'validator/lib/isEmpty';
import { error, success } from 'code/format';
import { uploadSerieLogo } from '@/lib/upload';
import SerieController from 'database/serie/controller';
import SerieEnigmaOrderController from 'database/serieEnigmaOrder/controller';
import SerieCreationController from 'database/serieCreator/controller';
import type { Request, Response, NextFunction } from 'express';
import type { Serie } from '@prisma/client';
import isNumeric from 'validator/lib/isNumeric';

interface SerieCreateRequest extends Request {
	body: {
		title: string;
		description: string;
	}
}

class serieCRUD {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async create(req: SerieCreateRequest, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.title || !isString(req.body.title) || isEmpty(req.body.title))
			return error(req, res, 'RE_002', { data: { key: 'title' } }).res;
		if (!req.body.description || !isString(req.body.description) || isEmpty(req.body.description))
			return error(req, res, 'RE_002', { data: { key: 'description' } }).res;

		let serie: Serie | null = null;
		try {
			serie = await SerieController.create({
				title: req.body.title,
				description: req.body.description,
			});
			if (serie) {
				await SerieCreationController.create({
					user_id: req.user.id,
					serie_id: serie.id
				});
			}
		} catch (e: any) {
			if (e.code === 'P2002') {
				if (e.meta.target.includes('title'))
					return error(req, res, 'SE_001').res;
			} else
				return error(req, res, 'SE_002', { data: { serieCreationFailed: true } });
		}
		if (!serie || typeof serie === 'boolean')
			return error(req, res, 'SE_002', { data: { serieCreationFailed: true } });
		return success(req, res, 'SE_101', {
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
		if (!Object.keys(req.params).length)
			return error(req, res, 'RE_007').res;
		if (!req.params.id || !isNumeric(req.params.id))
			return error(req, res, 'RE_003', { data: { key: 'id' } }).res;
		const id = Number(req.params.id);
		if (!await SerieController.thisSerieIsCreatedByUser(id, req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'SE_104', {
			data: {
				serieDelete: await SerieController.delete(id)
			}
		}).res;
	}
}

class serie extends serieCRUD {
	static async findOne(req: Request, res: Response, next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.serie_id)
			return error(req, res, 'RE_002', { data: { key: 'serie_id' } }).res;
		return success(req, res, 'SE_101', {
			data: {
				serie: await SerieController.findOne(req.body.serie_id as number)
			}
		}).res;
	}

	static async getCreatedByUser(req: Request, res: Response, _next: NextFunction) {
		return success(req, res, 'SE_101', {
			data: {
				series: await SerieController.findCreatedByUser(req.user.id)
			}
		}).res;
	}

	static async thisSerieIsCreatedByUser(req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.serie_id)
			return error(req, res, 'RE_002', { data: { key: 'serie_id' } }).res;
		return success(req, res, 'SE_101', {
			data: {
				isCreatedByUser: await SerieController.thisSerieIsCreatedByUser(Number(req.body.serie_id), req.user.id)
			}
		}).res;
	}

	static async updatePart(part: 'title' | 'description' | 'points', req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.serie_id || typeof req.body.serie_id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'serie_id' } }).res;
		if (!req.body[part])
			return error(req, res, 'RE_002', { data: { key: part } }).res;
		if (part === 'points' && typeof req.body[part] !== 'number' || req.body[part] < 0 || req.body[part] > 5000)
			return error(req, res, 'RE_002', { data: { key: part } }).res;
		if (!await SerieController.thisSerieIsCreatedByUser(Number(req.body.serie_id), req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'SE_102', {
			data: {
				isUpdated: await SerieController.updatePart(Number(req.body.serie_id), part, req.body[part])
			}
		}).res;
	}

	static async updateEnigmaOrder(req: Request, res: Response, next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.serie_id || typeof req.body.serie_id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'serie_id' } }).res;
		if (!req.body.order || typeof req.body.order !== 'object')
			return error(req, res, 'RE_002', { data: { key: 'order' } }).res;
		if (!await SerieController.thisSerieIsCreatedByUser(Number(req.body.serie_id), req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'SE_102', {
			data: {
				isUpdated: await SerieEnigmaOrderController.updateOrder(req.body.order)
			}
		}).res;
	}
}

export default Router()
	.get('/createByUser', jwtMiddleware.acceptUser, serie.getCreatedByUser)

	.post('/create', jwtMiddleware.acceptUser, serie.create)
	.post('/isCreatedByUser', jwtMiddleware.acceptUser, serie.thisSerieIsCreatedByUser)
	.post('/one', jwtMiddleware.acceptUser, serie.findOne)

	.post('/update/order', jwtMiddleware.acceptUser, serie.updateEnigmaOrder)
	.post('/update/title', jwtMiddleware.acceptUser, (req, res, next) => serie.updatePart('title', req, res, next))
	.post('/update/description', jwtMiddleware.acceptUser, (req, res, next) => serie.updatePart('description', req, res, next))
	.post('/update/points', jwtMiddleware.acceptUser, (req, res, next) => serie.updatePart('points', req, res, next))
	.post('/update/image',
		jwtMiddleware.acceptUser,
		uploadSerieLogo.middleware.single('image'),
		uploadSerieLogo.check
	)

	.delete('/:id', jwtMiddleware.acceptUser, serie.delete);
