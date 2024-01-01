/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import isNumeric from 'validator/lib/isNumeric';
import { error, returnFormat, success } from 'code/format';
import { jwtMiddleware } from 'lib/jwt';
import asyncHandler from 'lib/asyncHandler';
import { checkAchievement } from '@/achievement';
import { enigmaContent, enigmaLogo } from 'lib/upload';
import { seriesIsPublished } from 'lib/series';
import SeriesController from 'database/series/controller';
import SeriesEnigmaOrder from 'database/seriesEnigmaOrder/controller';
import SeriesVerifiedBy from 'database/seriesVerifiedBy/controller';
import EnigmaController from 'database/enigma/controller';
import EnigmaContentController from 'database/enigmaContent/controller';
import EnigmaCreatorController from 'database/enigmaCreator/controller';
import EnigmaFinishedController from 'database/enigmaFinished/controller';
import EnigmaSolutionController from 'database/enigmaSolution/controller';
import type { NextFunction, Request, Response } from 'express';

/**
 * Verify is bitmasking, pass 1 or 0 for active/desactive check
 * 1- enigmaID
 * 2- serieID
 * 3- userID
 * 4- solution
 */
const verifyRequest = (req: Request, res: Response, verify = '0000'): returnFormat | null => {
	const missingKeys: string[] = [];

	if (!Object.keys(req.body).length)
		return error(req, res, 'RE_001');
	for (let i = 0; i < verify.length; i++) {
		if (verify[i] ===  '0')
			continue;
		switch (i) {
		case 0:
			if ((!req.body.id || !isNumeric(String(req.body.id))))
				missingKeys.push('id');
			break;
		case 1:
			if ((!req.body.series_id || !isNumeric(String(req.body.series_id))))
				missingKeys.push('series_id');
			break;
		case 2:
			if ((!req.body.user_id || !isNumeric(String(req.body.user_id))))
				missingKeys.push('user_id');
			break;
		case 3:
			if (!req.body.solution)
				missingKeys.push('solution');
		}
	}
	if (missingKeys.length) {
		return error(req, res, 'RE_002', { data: {
			key: (missingKeys.length === 1)
				? missingKeys[0]
				: undefined,
			keys: (missingKeys.length > 1)
				? missingKeys
				: undefined
		}});
	}
	return null;
};

class enigmaCRUD {
	static async create(req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.series_id || typeof req.body.series_id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'series_id' } }).res;
		if (!req.body.order || typeof req.body.order !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'order' } }).res;
		if (!req.body.title || typeof req.body.title !== 'string')
			return error(req, res, 'RE_002', { data: { key: 'title' } }).res;
		if (!req.body.description || typeof req.body.description !== 'string')
			return error(req, res, 'RE_002', { data: { key: 'description' } }).res;
		if (!await SeriesController.userRight(Number(req.body.series_id), req.user.id))
			return error(req, res, 'SE_003').res;

		const enigma = await EnigmaController.create({
			series_id: Number(req.body.series_id),
			title: req.body.title,
			image: null,
			description: req.body.description
		});
		if (!enigma)
			return error(req, res, 'EN_004').res;
		await EnigmaCreatorController.create({ enigma_id: enigma.id, user_id: req.user.id });
		await SeriesEnigmaOrder.create({ series_id: Number(req.body.series_id), enigma_id: enigma.id, order: Number(req.body.order) });
		return success(req, res, 'EN_102', {
			data: {
				enigma
			}
		}).res;
	}

	static async get(req: Request<any>, res: Response<any>, _next: NextFunction) {
		const hasError = verifyRequest(req, res, '1000');
		if (hasError)
			return hasError.res;
		
		const isCreator = await EnigmaCreatorController.thisEnigmaIsCreatedByUser(Number(req.body.id), req.user.id);
		return success(req, res, 'EN_101', {
			data: {
				isCreator,
				enigma: (isCreator)
					? await EnigmaController.findOne(Number(req.body.id))
					: undefined
			}
		}).res;
	}

	static async update(req: Request<any>, res: Response<any>, _next: NextFunction) {
		const hasError = verifyRequest(req, res, '1000');
		if (hasError)
			return hasError.res;
		const enigma = await EnigmaController.findOne(req.body.id);
		if (enigma) {
			EnigmaController.update({
				id: enigma.id,
				series_id: enigma.series_id,
				title: enigma.title,
				image: enigma.image,
				description: enigma.description,
				creation_date: null,
				modification_date: null
			});
		}
	}

	static async delete(req: Request<any>, res: Response<any>, _next: NextFunction) {
		if (!Object.keys(req.params).length)
			return error(req, res, 'RE_007').res;
		if (!req.params.id || !isNumeric(req.params.id))
			return error(req, res, 'RE_003', { data: { key: 'id' } }).res;
		const id = Number(req.params.id);
		if (!await EnigmaController.thisEnigmaIsCreatedByUser(id, req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'AC_106', {
			data: {
				enigmaDelete: await EnigmaController.delete(id)
			}
		}).res;
	}

}

class enigma extends enigmaCRUD {
	static async getCreatedByUser(req: Request, res: Response, _next: NextFunction) {
		const isCreator = await EnigmaCreatorController.thisEnigmaIsCreatedByUser(Number(req.body.id), req.user.id);
		return success(req, res, isCreator
			? 'EN_105'
			: 'EN_005', {
			data: {
				isCreator
			}
		});
	}

	static async getAllOfSeries(req: Request<any>, res: Response<any>, _next: NextFunction) {
		const hasError = verifyRequest(req, res, '0100');
		if (hasError)
			return hasError.res;
		const enigmas = await EnigmaController.findAll(Number(req.body.series_id), req.user.id);
		if (!enigmas)
			return error(req, res, 'EN_001').res;
		return success(req, res, 'EN_102', {
			data: {
				enigmas
			}
		}).res;
	}

	static async isFinished(req: Request<any>, res: Response<any>, _next: NextFunction) {
		const hasError = verifyRequest(req, res, '1010');
		if (hasError)
			return hasError.res;

		const isFinished = await EnigmaFinishedController.isFinished(req.body.id, req.body.user_id);
		if (!isFinished)
			return error(req, res, 'EN_002').res;
		return success(req, res, 'EN_103', {
			data: {
				isFinished
			}
		}).res;
	}

	static async getSolution(req: Request, res: Response, _next: NextFunction) {
		const hasError = verifyRequest(req, res, '1000');
		if (hasError)
			return hasError.res;
		if (!await EnigmaCreatorController.thisEnigmaIsCreatedByUser(Number(req.body.id), req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'EN_104', {
			data: {
				solution: await EnigmaSolutionController.find(Number(req.body.id))
			}
		}).res;
	}

	static async saveSolution(req: Request, res: Response, _next: NextFunction) {
		const hasError = verifyRequest(req, res, '1000');
		if (hasError)
			return hasError.res;
		if (!req.body.solution || typeof req.body.solution !== 'string')
			return error(req, res, 'RE_002', { data: { key: 'solution' } }).res;
		if (!req.body.type || typeof req.body.type !== 'string')
			return error(req, res, 'RE_002', { data: { key: 'type' } }).res;
		if (!await EnigmaCreatorController.thisEnigmaIsCreatedByUser(Number(req.body.id), req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'EN_104', {
			data: {
				solution: await EnigmaSolutionController.update({ enigma_id: Number(req.body.id), type: req.body.type, solution: req.body.solution})
			}
		}).res;
	}

	static async verifySolution(req: Request, res: Response, _next: NextFunction) {
		const hasError = verifyRequest(req, res, '1001');
		if (hasError)
			return hasError.res;
		const isCorrect = await EnigmaSolutionController.checkSolution(req.body.id, req.body.solution);
		if (isCorrect) {
			await EnigmaFinishedController.create({
				enigma_id: Number(req.body.id),
				user_id: req.user.id
			});
			await checkAchievement(req, res, 'seriesFinished', {
				enigma_id: Number(req.body.id),
				user_id: req.user.id
			});
		}
		return success(req, res, 'EN_104', {
			data: {
				isCorrect
			}
		}).res;
	}

	static async updatePart(part: 'title' | 'description' | 'points', req: Request, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.enigma_id || typeof req.body.enigma_id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'enigma_id' } }).res;
		if (!req.body[part])
			return error(req, res, 'RE_002', { data: { key: part } }).res;
		if (part === 'points' && typeof req.body[part] !== 'number' || req.body[part] < 0 || req.body[part] > 5000)
			return error(req, res, 'RE_002', { data: { key: part } }).res;
		if (!await EnigmaCreatorController.thisEnigmaIsCreatedByUser(Number(req.body.enigma_id), req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'SE_102', {
			data: {
				isUpdated: await EnigmaController.updatePart(Number(req.body.enigma_id), part, req.body[part])
			}
		}).res;
	}

	static async getPage(req: Request, res: Response, _next: NextFunction, devProdModerator: 'dev' | 'prod' | 'moderator') {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.enigma_id || typeof req.body.enigma_id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'enigma_id' } }).res;
		if (devProdModerator === 'prod' && (!req.body.series_id || typeof req.body.series_id !== 'number'))
			return error(req, res, 'RE_002', { data: { key: 'series_id' } }).res;
		if (
			devProdModerator === 'dev'
			&& !await EnigmaCreatorController.thisEnigmaIsCreatedByUser(Number(req.body.enigma_id), req.user.id)
		)
			return error(req, res, 'SE_003').res;

		const isModo = (devProdModerator === 'moderator')
			? await SeriesVerifiedBy.isModeratorOfSeries(req.body.series_id, req.user.id)
			: false;
		const getSolution = async () => {
			if (req.user.role !== 'USER' && isModo && !await SeriesVerifiedBy.seriesIsVerified(req.body.series_id))
				return await EnigmaSolutionController.find(req.body.enigma_id);
			if (devProdModerator === 'prod')
				return (await EnigmaSolutionController.findType(Number(req.body.enigma_id)))?.type;
			return undefined;
		};
		const getEnigma = (devProdModerator === 'dev')
			? await EnigmaContentController.readDevelopment(Number(req.body.enigma_id))
			: await EnigmaContentController.readProduction(
				Number(req.body.enigma_id),
				Number(req.body.series_id),
				req.user.id,
				isModo
			);
		const authorized = getEnigma !== null && getEnigma !== false && !Object.prototype.hasOwnProperty.call(getEnigma, 'notExist');

		return success(req, res, 'SE_102', {
			data: {
				enigma: getEnigma,
				solution: await getSolution(),
				info: ((devProdModerator === 'prod' || devProdModerator === 'moderator') && authorized)
					? await EnigmaController.findOneInfo(Number(req.body.enigma_id))
					: undefined,
				objectSolutionKeys: ((devProdModerator === 'prod' || devProdModerator === 'moderator') && authorized)
					? (await EnigmaSolutionController.getListOfKeys(Number(req.body.enigma_id)))
					: undefined,
			}
		}).res;
	}

	static async savePage(req: Request, res: Response, _next: NextFunction, devOrProd: 'dev' | 'prod') {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.enigma_id || typeof req.body.enigma_id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'enigma_id' } }).res;
		if (!req.body.editor_data)
			return error(req, res, 'RE_002', { data: { key: 'editor_data' } }).res;
		if (!await EnigmaCreatorController.thisEnigmaIsCreatedByUser(Number(req.body.enigma_id), req.user.id))
			return error(req, res, 'SE_003').res;
		return success(req, res, 'SE_102', {
			data: {
				isSaved: await EnigmaContentController.updatePart(req.body.enigma_id, req.body.editor_data, devOrProd) !== null
			}
		}).res;
	}
}

export default Router()
	.post('/createByUser', jwtMiddleware.acceptUser, asyncHandler(enigma.getCreatedByUser))

	.post('/create', jwtMiddleware.acceptUser, asyncHandler(enigma.create))
	.post('/one', jwtMiddleware.acceptUser, asyncHandler(enigma.get))
	.post('/all', jwtMiddleware.acceptUser, asyncHandler(enigma.getAllOfSeries))
	.post('/finished', jwtMiddleware.acceptUser, asyncHandler(enigma.isFinished))

	.post('/solution/:type', jwtMiddleware.acceptUser, asyncHandler((req, res, next) => {
		switch (req.params.type as 'get' | 'save' | 'check') {
		case 'get':
			return enigma.getSolution(req, res, next);
		case 'save':
			return enigma.saveSolution(req, res, next);
		case 'check':
			return enigma.verifySolution(req, res, next);
		}
	}))

	.post('/page/:type', jwtMiddleware.acceptUser, asyncHandler((req, res, next) => {
		if (['dev', 'prod', 'moderator'].includes(req.params.type))
			return enigma.getPage(req, res, next, req.params.type as 'dev' | 'prod' | 'moderator');
		return next();
	}))
	.put('/page/:type', seriesIsPublished, jwtMiddleware.acceptUser, asyncHandler((req, res, next) => {
		if (['dev', 'prod'].includes(req.params.type))
			return enigma.savePage(req, res, next, req.params.type as 'dev' | 'prod');
		next();
	}))

	.post('/update/image', seriesIsPublished, jwtMiddleware.acceptUser, enigmaLogo.middleware.single('image'), asyncHandler(enigmaLogo.check))
	.post('/update/:type', seriesIsPublished, jwtMiddleware.acceptUser, asyncHandler((req, res, next) => enigma.updatePart(req.params.type as 'title' | 'description', req, res, next)))

	.get('/content/list', jwtMiddleware.acceptUser, asyncHandler(enigmaContent.listOfImage))
	.post('/content/image', jwtMiddleware.acceptUser, enigmaContent.middleware.single('image'), asyncHandler(enigmaContent.check))

	.delete('/:id', jwtMiddleware.acceptUser, asyncHandler(enigma.delete));
