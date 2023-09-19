import type { Response, Request } from 'express';
import type Achievement from './abstractAchievementClass';

import FirstConnection, { FirstConnectionName } from './list/firstConnection';

export const achievementList: Achievement[] = [
	new FirstConnection()
];

export type achievementName = FirstConnectionName;

export const getAchievement = (name: achievementName): Achievement | undefined => {
	return achievementList.find((e) => e.name === name);
};

export const checkAchievement = async (
	req: Request,
	res: Response,
	name: achievementName,
	data: unknown
): Promise<void> => {
	const achievement = getAchievement(name as achievementName);
	if (!req.user || !achievement)
		return;
	await achievement.check(res, data);
};
