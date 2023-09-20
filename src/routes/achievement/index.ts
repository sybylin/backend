import { isEmpty, isString } from 'lodash';
import { Router } from 'express';
import { error, success } from '@/code/format';
import { jwtMiddleware } from '@/lib/jwt';
import getInfo from '@/code';
import AchievementController from 'database/achievement/controller';
import UserAchievementController from 'database/userAchievement/controller';
import { getAchievement, achievementName } from 'src/achievement';
import type { Request, Response, NextFunction } from 'express';

class achievement {
	static async getWithName(req: Request, res: Response, next: NextFunction) {
		if (!req.params.name || !isString(req.params.name) || isEmpty(req.params.name))
			return error(req, res, 'RE_003', { data: { key: 'achievementName' } }).res;
		if (!req.user)
			return next(new Error(getInfo('GE_001').message));

		const achievement = getAchievement(req.params.name as achievementName);
		if (!achievement)
			return error(req, res, 'AC_001').res;
		const has = await UserAchievementController.findOne(req.user?.id, achievement.id)
			.catch(() => next(new Error(getInfo('GE_001').message)));
		return success(req, res, (has !== null)
			? 'AC_102'
			: 'AC_103',
		{ data: { has: has !== null } });
	}

	static async getAll(req: Request, res: Response, next: NextFunction) {
		if (!req.user)
			return next(new Error(getInfo('GE_001').message));
		const list = await AchievementController.findAll()
			.catch(() => next(new Error(getInfo('GE_001').message)));
		return success(req, res, 'AC_102', { data: { list }});
	}

	static async getAllForUser(req: Request, res: Response, next: NextFunction) {
		if (!req.user)
			return next(new Error(getInfo('GE_001').message));
		const list = await UserAchievementController.getAllForUser(req.user.id)
			.catch(() => next(new Error(getInfo('GE_001').message)));
		return success(req, res, 'AC_102', { data: { list } });
	}

	static async getOneForUser(req: Request, res: Response, next: NextFunction) {
		if (!req.params.name || !isString(req.params.name) || isEmpty(req.params.name))
			return error(req, res, 'RE_003', { data: { key: 'achievementName' } }).res;
		if (!req.user)
			return next(new Error(getInfo('GE_001').message));
		const list = await UserAchievementController.getOneForUser(req.user.id, req.params.name)
			.catch(() => next(new Error(getInfo('GE_001').message)));
		return success(req, res, 'AC_102', { data: { list } });
	}
}

export default Router()
	.get('/all', jwtMiddleware.acceptUser, achievement.getAll)
	.get('/one/:name', jwtMiddleware.acceptUser, achievement.getWithName)
	.get('/user/all', jwtMiddleware.acceptUser, achievement.getAllForUser)
	.get('/user/:name', jwtMiddleware.acceptUser, achievement.getOneForUser);
