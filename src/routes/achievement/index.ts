/* eslint-disable @typescript-eslint/no-unused-vars */
import { isEmpty, isString } from 'lodash';
import { Router } from 'express';
import { error, success } from '@/code/format';
import asyncHandler from '@/lib/asyncHandler';
import { jwtMiddleware } from '@/lib/jwt';
import AchievementController from 'database/achievement/controller';
import UserAchievementController from 'database/userAchievement/controller';
import { getAchievement, achievementName } from 'src/achievement';
import type { Request, Response, NextFunction } from 'express';

class achievement {
	static async getWithName(req: Request, res: Response, _next: NextFunction) {
		if (!req.params.name || !isString(req.params.name) || isEmpty(req.params.name))
			return error(req, res, 'RE_003', { data: { key: 'achievementName' } }).res;
		const achievement = getAchievement(req.params.name as achievementName);
		if (!achievement)
			return error(req, res, 'AC_001').res;
		const has = await UserAchievementController.findOne(req.user?.id, achievement.id);
		return success(req, res, (has !== null)
			? 'AC_102'
			: 'AC_103',
		{ data: { has: has !== null } });
	}

	static async getAll(req: Request, res: Response, _next: NextFunction) {
		const list = await AchievementController.findAll();
		return success(req, res, 'AC_102', { data: { list }});
	}

	static async getAllForUser(req: Request, res: Response, _next: NextFunction) {
		const list = await UserAchievementController.getAllForUser(req.user.id);
		return success(req, res, 'AC_102', { data: { list } });
	}

	static async getOneForUser(req: Request, res: Response, _next: NextFunction) {
		if (!req.params.name || !isString(req.params.name) || isEmpty(req.params.name))
			return error(req, res, 'RE_003', { data: { key: 'achievementName' } }).res;
		const list = await UserAchievementController.getOneForUser(req.user.id, req.params.name);
		return success(req, res, 'AC_102', { data: { list } });
	}
}

export default Router()
	.get('/all', jwtMiddleware.acceptUser, asyncHandler(achievement.getAll))
	.get('/one/:name', jwtMiddleware.acceptUser, asyncHandler(achievement.getWithName))
	.get('/user/all', jwtMiddleware.acceptUser, asyncHandler(achievement.getAllForUser))
	.get('/user/:name', jwtMiddleware.acceptUser, asyncHandler(achievement.getOneForUser));
