import UserAchievementController from 'database/userAchievement/controller';
import SeriesFinishedController from 'database/seriesFinished/controller';
import { UserAchievement } from '@prisma/client';
import { enigma } from 'database/db.instance';
import { log } from '@/lib/log';
import Achievement from '../abstractAchievementClass';
import type { Response } from 'express';

interface SeriesFinishedCheckAchievement {
	enigma_id: number;
	user_id: number;
}

class SeriesFinished extends Achievement {
	constructor() {
		super('seriesFinished', 'Series finished', 100);
	}

	async check(res: Response, data: SeriesFinishedCheckAchievement): Promise<boolean> {
		const seriesId = await enigma.findUnique({
			where: { id: data.enigma_id },
			select: {
				series_id: true
			}
		})
			.catch((e) => log.error(e));

		if (!seriesId)
			return false;
		const finishedStatus = await SeriesFinishedController.isFinished(seriesId.series_id, data.user_id);
		if (finishedStatus !== 'already' && finishedStatus === true) {
			const check = await UserAchievementController.create({
				user_id: data.user_id,
				achievement_id: this.id
			})
				.catch((e) => log.error(e));
			if (check) {
				this.add(res);
				return true;
			}
		}
		return false;
	}

	async ownedToUser(user_id: number): Promise<boolean> {
		return UserAchievementController.isExist(user_id, this.id);
	}

	async removeToUser(user_id: number): Promise<UserAchievement> {
		return UserAchievementController.delete(user_id, this.id);
	}
}

export type SeriesFinishedName = 'seriesFinished';
export default SeriesFinished;
