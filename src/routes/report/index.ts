/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import isEmpty from 'validator/lib/isEmpty';
import isNumeric from 'validator/lib/isNumeric';
import { error, success } from 'code/format';
import asyncHandler from 'lib/asyncHandler';
import { captchaMiddleware } from 'lib/captcha';
import { jwtMiddleware } from 'lib/jwt';
import { isString } from 'lib/isSomething';
import ReportController from 'database/report/controller';
import type { Request, Response, NextFunction } from 'express';
import type { ReportType } from '@prisma/client';

interface ReportCreateRequest extends Request {
	body: {
		type: ReportType,
		message: string
	}
}

interface ReportDeleteRequest extends Request {
	body: {
		id: number
	}
}

class Report {
	static async create(req: ReportCreateRequest, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.type || !isString(req.body.type) || isEmpty(req.body.type))
			return error(req, res, 'RE_002', { data: { key: 'type' } }).res;
		if (!req.body.message || !isString(req.body.message) || isEmpty(req.body.message))
			return error(req, res, 'RE_002', { data: { key: 'message' } }).res;
		
		let report: { id: number } | null = null;
		try {
			report = await ReportController.create({
				type: req.body.type,
				message: req.body.message
			});
		} catch {
			return error(req, res, 'RP_001');
		}
		if (!report)
			return error(req, res, 'RP_001');
		return success(req, res, 'RP_101', {
			data: {
				id: report.id,
				timestamp: new Date().getTime()
			}
		}).res;
	}

	static async get(req: ReportCreateRequest, res: Response, _next: NextFunction) {
		return success(req, res, 'RP_102', {
			data: {
				list: await ReportController.findAll()
			}
		});
	}

	static async update(req: ReportCreateRequest, res: Response, _next: NextFunction) {

	}

	static async delete(req: ReportDeleteRequest, res: Response, _next: NextFunction) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.id || isNumeric(String(req.body.id)))
			return error(req, res, 'RE_002', { data: { key: 'id' } }).res;
		return success(req, res, 'RP_102', {
			data: {
				id: Number(req.body.id),
				delete: await ReportController.delete(Number(req.body.id))
			}
		});
	}
}

export default Router()
	.get('/', jwtMiddleware.acceptAdministrator, asyncHandler(Report.get))
	.post('/', captchaMiddleware, asyncHandler(Report.create))
	.delete('/', jwtMiddleware.acceptAdministrator,asyncHandler(Report.delete));
