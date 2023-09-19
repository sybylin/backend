import { isEmpty, isString } from 'lodash';
import { Router } from 'express';
import { error, success } from '@/code/format';
import { jwtMiddleware } from '@/lib/jwt';
import getInfo from '@/code';
import UserAchievementController from 'database/userAchievement/controller';
import { getAchievement, achievementName } from 'src/achievement';
import type { Request, Response, NextFunction } from 'express';

export default Router()
	.get('/:name', jwtMiddleware.acceptUser, async (req: Request, res: Response, next: NextFunction) => {
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
	});
