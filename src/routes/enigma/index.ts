import { Router } from 'express';
import isEmpty from 'validator/lib/isEmpty';
import isNumeric from 'validator/lib/isNumeric';

import EnigmaController from 'database/enigma/controller';
import EnigmaFinishedController from 'database/enigmaFinished/controller';
import EnigmaSolutionController from 'database/enigmaSolution/controller';
import { getInfo } from 'code/index';
import { error, returnFormat, success } from 'code/format';
import { jwtMiddleware } from 'lib/jwt';

import type { NextFunction, Request, Response } from 'express';

/**
 * Verify is bitmasking, pass 1 or 0 for active/desactive check
 * 1- enigmaID
 * 2- serieID
 * 3- userID
 * 4- solution
 */
const verifyData = (req: Request<any>, res: Response<any>, verify = '0000'): returnFormat | null => {
	if (!Object.keys(req.body).length)
		return error(req, res, 'RE_001');
	if (verify[0] === '1' && (!req.body.id || isEmpty(req.body.id) || !isNumeric(req.body.id)))
		return error(req, res, 'RE_002', { data: { key: 'id' } });
	if (verify[1] === '1' && (!req.body.series_id || isEmpty(req.body.series_id) || !isNumeric(req.body.series_id)))
		return error(req, res, 'RE_002', { data: { key: 'series_id' } });
	if (verify[2] === '1' && (!req.body.user_id || isEmpty(req.body.user_id) || !isNumeric(req.body.user_id)))
		return error(req, res, 'RE_002', { data: { key: 'user_id' } });
	if (verify[3] === '1' && (!req.body.solution || isEmpty(req.body.solution) || !isNumeric(req.body.solution)))
		return error(req, res, 'RE_002', { data: { key: 'solution' } });
	return null;
};

class enigma {
	static get(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyData(req, res, '1000');
		if (hasError)
			return hasError.res;
		EnigmaController.findOne(Number(req.body.id))
			.then((d) => {
				if (!d)
					return error(req, res, 'EN_001').res;
				return success(req, res, 'EN_101', {
					data: {
						...d
					}
				}).res;
			})
			.catch(() => next(new Error(getInfo('GE_001').message)));
	}

	static async update(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyData(req, res, '1000');
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
				points: enigma.points,
				creation_date: null,
				modification_date: null
			})
				.catch(() => next(new Error(getInfo('GE_002').message)));
		}
	}

	static async delete(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyData(req, res, '1000');
		if (hasError)
			return hasError.res;
		EnigmaController.delete(req.body.id)
			.then(() => success(req, res, 'AC_106').res)
			.catch(() => next(new Error(getInfo('GE_002').message)));
	}

	static getAllOfSeries(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyData(req, res, '0100');
		if (hasError)
			return hasError.res;
		EnigmaController.findAll(Number(req.body.series_id))
			.then((d) => {
				if (!d)
					return error(req, res, 'EN_001').res;
				return success(req, res, 'EN_102', {
					data: {
						...d
					}
				}).res;
			})
			.catch(() => next(new Error(getInfo('GE_001').message)));
	}

	static isFinished(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyData(req, res, '1010');
		if (hasError)
			return hasError.res;

		EnigmaFinishedController.isFinished(req.body.id, req.body.user_id)
			.then((d) => {
				if (!d)
					return error(req, res, 'EN_002').res;
				return success(req, res, 'EN_103', {
					data: {
						isFinished: d
					}
				}).res;
			})
			.catch(() => next(new Error(getInfo('GE_001').message)));
	}

	static verifySolution(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyData(req, res, '1001');
		if (hasError)
			return hasError.res;

		EnigmaSolutionController.checkSolution(req.body.id, req.body.solution)
			.then((d) => {
				return success(req, res, 'EN_104', {
					data: {
						isCorrect: d
					}
				}).res;
			})
			.catch(() => next(new Error(getInfo('GE_001').message)));
	}
}

export default Router()
	.get('/one', jwtMiddleware.acceptUser, enigma.get)
	.get('/all', jwtMiddleware.acceptUser, enigma.getAllOfSeries)
	.get('/finished', jwtMiddleware.acceptUser, enigma.isFinished)
	.get('/check', jwtMiddleware.acceptUser, enigma.verifySolution);
