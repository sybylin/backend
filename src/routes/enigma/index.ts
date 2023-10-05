/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import isEmpty from 'validator/lib/isEmpty';
import isNumeric from 'validator/lib/isNumeric';
import { error, returnFormat, success } from 'code/format';
import { jwtMiddleware } from 'lib/jwt';
import SerieController from 'database/serie/controller';
import SerieEnigmaOrder from 'database/serieEnigmaOrder/controller';
import EnigmaController from 'database/enigma/controller';
import EnigmaCreatorController from 'database/enigmaCreator/controller';
import EnigmaFinishedController from 'database/enigmaFinished/controller';
import EnigmaSolutionController from 'database/enigmaSolution/controller';
import type { NextFunction, Request, Response } from 'express';
import type { Enigma } from '@prisma/client';
import asyncHandler from '@/lib/asyncHandler';

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
			if ((!req.body.serie_id || !isNumeric(String(req.body.serie_id))))
				missingKeys.push('serie_id');
			break;
		case 2:
			if ((!req.body.user_id || !isNumeric(String(req.body.user_id))))
				missingKeys.push('user_id');
			break;
		case 3:
			if ((!req.body.solution || isEmpty(String(req.body.solution))))
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
		if (!req.body.serie_id || typeof req.body.serie_id !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'serie_id' } }).res;
		if (!req.body.order || typeof req.body.order !== 'number')
			return error(req, res, 'RE_002', { data: { key: 'order' } }).res;
		if (!req.body.title || typeof req.body.title !== 'string')
			return error(req, res, 'RE_002', { data: { key: 'title' } }).res;
		if (!req.body.description || typeof req.body.description !== 'string')
			return error(req, res, 'RE_002', { data: { key: 'description' } }).res;
		if (!await SerieController.thisSerieIsCreatedByUser(Number(req.body.serie_id), req.user.id))
			return error(req, res, 'SE_003').res;

		const enigma = await EnigmaController.create({
			serie_id: Number(req.body.serie_id),
			title: req.body.title,
			image: null,
			description: req.body.description,
			points: 0
		});
		if (!enigma)
			return error(req, res, 'EN_004').res;
		await EnigmaCreatorController.create({ enigma_id: enigma.id, user_id: req.user.id });
		await SerieEnigmaOrder.create({ serie_id: Number(req.body.serie_id), enigma_id: enigma.id, order: Number(req.body.order) });
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
		
		const enigma = await EnigmaController.findOne(Number(req.body.id));
		const isCreator = await EnigmaCreatorController.findOne(Number(req.body.id), req.user.id);
		return success(req, res, 'EN_101', {
			data: {
				isCreator: isCreator !== null,
				enigma,
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
				serie_id: enigma.serie_id,
				title: enigma.title,
				image: enigma.image,
				description: enigma.description,
				points: enigma.points,
				creation_date: null,
				modification_date: null
			});
		}
	}

	static async delete(req: Request<any>, res: Response<any>, _next: NextFunction) {
		const hasError = verifyRequest(req, res, '1000');
		if (hasError)
			return hasError.res;
		await EnigmaController.delete(req.body.id);
		return success(req, res, 'AC_106').res;
	}

}

class enigma extends enigmaCRUD {
	static async isCreator(req: Request, res: Response, _next: NextFunction) {
		const isCreator = await EnigmaCreatorController.findOne(Number(req.body.id), req.user.id);
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
		const enigmas = await EnigmaController.findAll(Number(req.body.serie_id));
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

	static async verifySolution(req: Request<any>, res: Response<any>, _next: NextFunction) {
		const hasError = verifyRequest(req, res, '1001');
		if (hasError)
			return hasError.res;
		const isCorrect = await EnigmaSolutionController.checkSolution(req.body.id, req.body.solution);
		return success(req, res, 'EN_104', {
			data: {
				isCorrect
			}
		}).res;
	}
}

export default Router()
	.get('/isCreator', jwtMiddleware.acceptUser, asyncHandler(enigma.isCreator))

	.post('/create', jwtMiddleware.acceptUser, asyncHandler(enigma.create))
	.post('/one', jwtMiddleware.acceptUser, asyncHandler(enigma.get))
	.post('/all', jwtMiddleware.acceptUser, asyncHandler(enigma.getAllOfSeries))
	.post('/finished', jwtMiddleware.acceptUser, asyncHandler(enigma.isFinished))
	.post('/check', jwtMiddleware.acceptUser, asyncHandler(enigma.verifySolution));
