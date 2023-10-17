/* eslint-disable @typescript-eslint/no-unused-vars */
import { jwtMiddleware } from '@/lib/jwt';
import asyncHandler from '@/lib/asyncHandler';
import { Router } from 'express';
import { isString } from 'lodash';
import isEmpty from 'validator/lib/isEmpty';
import { error, success } from 'code/format';
import { uploadSeriesLogo } from '@/lib/upload';
import SeriesController from 'database/series/controller';
import SeriesEnigmaOrderController from 'database/seriesEnigmaOrder/controller';
import SeriesCreationController from 'database/seriesCreator/controller';
import type { Request, Response, NextFunction } from 'express';
import type { Series } from '@prisma/client';
import isNumeric from 'validator/lib/isNumeric';

interface SeriesCreateRequest extends Request {
	body: {
		title: string;
		description: string;
	}
}

class serieCRUD {
	static async create(req: SeriesCreateRequest, res: Response, _next: NextFunction) {
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
			if (serie) {
				await SeriesCreationController.create({
					user_id: req.user.id,
					series_id: serie.id
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

	static async delete(req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.params).length)
			return error(req, res, 'RE_007').res;
		if (!req.params.id || !isNumeric(req.params.id))
			return error(req, res, 'RE_003', { data: { key: 'id' } }).res;
		const id = Number(req.params.id);
		if (!await SeriesController.thisSeriesIsCreatedByUser(id, req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'SE_104', {
			data: {
				serieDelete: await SeriesController.delete(id)
			}
		}).res;
	}
}

class serie extends serieCRUD {
	static async getPublishedSeries(req: Request, res: Response, _next: NextFunction) {
		return success(req, res, 'SE_101', {
			data: {
				series: await SeriesController.findAllPublished(req.user.id)
			}
		}).res;
	}

	static async findOne(req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.series_id)
			return error(req, res, 'RE_002', { data: { key: 'series_id' } }).res;
		return success(req, res, 'SE_101', {
			data: {
				series: await SeriesController.findOne(req.body.series_id as number)
			}
		}).res;
	}

	static async getCreatedByUser(req: Request, res: Response, _next: NextFunction) {
		return success(req, res, 'SE_101', {
			data: {
				series: await SeriesController.findCreatedByUser(req.user.id)
			}
		}).res;
	}

	static async thisSeriesIsCreatedByUser(req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.series_id)
			return error(req, res, 'RE_002', { data: { key: 'series_id' } }).res;
		return success(req, res, 'SE_101', {
			data: {
				isCreatedByUser: await SeriesController.thisSeriesIsCreatedByUser(Number(req.body.series_id), req.user.id)
			}
		}).res;
	}

	static async updatePart(part: 'title' | 'description' | 'points' | 'published', req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.series_id || typeof req.body.series_id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'series_id' } }).res;
		if (!Object.prototype.hasOwnProperty.call(req.body, part))
			return error(req, res, 'RE_002', { data: { key: part } }).res;
		if (part === 'points' && typeof req.body[part] !== 'number' || req.body[part] < 0 || req.body[part] > 5000)
			return error(req, res, 'RE_002', { data: { key: part } }).res;
		if (!await SeriesController.thisSeriesIsCreatedByUser(Number(req.body.series_id), req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'SE_102', {
			data: {
				isUpdated: await SeriesController.updatePart(Number(req.body.series_id), part, req.body[part])
			}
		}).res;
	}

	static async updateEnigmaOrder(req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.series_id || typeof req.body.series_id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'series_id' } }).res;
		if (!req.body.order || typeof req.body.order !== 'object')
			return error(req, res, 'RE_002', { data: { key: 'order' } }).res;
		if (!await SeriesController.thisSeriesIsCreatedByUser(Number(req.body.series_id), req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'SE_102', {
			data: {
				isUpdated: await SeriesEnigmaOrderController.updateOrder(req.body.order)
			}
		}).res;
	}
}

export default Router()
	.get('/createByUser', jwtMiddleware.acceptUser, asyncHandler(serie.getCreatedByUser))
	.get('/published', jwtMiddleware.acceptUser, asyncHandler(serie.getPublishedSeries))

	.post('/create', jwtMiddleware.acceptUser, asyncHandler(serie.create))
	.post('/isCreatedByUser', jwtMiddleware.acceptUser, asyncHandler(serie.thisSeriesIsCreatedByUser))
	.post('/one', jwtMiddleware.acceptUser, asyncHandler(serie.findOne))
	.post('/update/order', jwtMiddleware.acceptUser, asyncHandler(serie.updateEnigmaOrder))
	.post('/update/title', jwtMiddleware.acceptUser, asyncHandler((req, res, next) => serie.updatePart('title', req, res, next)))
	.post('/update/description', jwtMiddleware.acceptUser, asyncHandler((req, res, next) => serie.updatePart('description', req, res, next)))
	.post('/update/points', jwtMiddleware.acceptUser, asyncHandler((req, res, next) => serie.updatePart('points', req, res, next)))
	.post('/update/published', jwtMiddleware.acceptUser, asyncHandler((req, res, next) => serie.updatePart('published', req, res, next)))
	.post('/update/image', jwtMiddleware.acceptUser, uploadSeriesLogo.middleware.single('image'), asyncHandler(uploadSeriesLogo.check))

	.delete('/:id', jwtMiddleware.acceptUser, asyncHandler(serie.delete));
