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

class enigma {
	static get(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyRequest(req, res, '1000');
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
			})
				.catch(() => next(new Error(getInfo('GE_002').message)));
		}
	}

	static async delete(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyRequest(req, res, '1000');
		if (hasError)
			return hasError.res;
		EnigmaController.delete(req.body.id)
			.then(() => success(req, res, 'AC_106').res)
			.catch(() => next(new Error(getInfo('GE_002').message)));
	}

	static async getAllOfSeries(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyRequest(req, res, '0100');
		if (hasError)
			return hasError.res;
		try {
			const enigmas = await EnigmaController.findAll(Number(req.body.serie_id));
			if (!enigmas)
				return error(req, res, 'EN_001').res;
			return success(req, res, 'EN_102', {
				data: {
					enigmas
				}
			}).res;
		} catch (e) {
			next(new Error(getInfo('GE_001').message));
		}
	}

	static isFinished(req: Request<any>, res: Response<any>, next: NextFunction) {
		const hasError = verifyRequest(req, res, '1010');
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
		const hasError = verifyRequest(req, res, '1001');
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
	.post('/one', jwtMiddleware.acceptUser, enigma.get)
	.post('/all', jwtMiddleware.acceptUser, enigma.getAllOfSeries)
	.post('/finished', jwtMiddleware.acceptUser, enigma.isFinished)
	.post('/check', jwtMiddleware.acceptUser, enigma.verifySolution);
