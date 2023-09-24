import UserAchievementController from 'database/userAchievement/controller';
import { UserAchievement } from '@prisma/client';
import Achievement from 'src/achievement/abstractAchievementClass';
import type { Response } from 'express';

interface FirstConnectionCheckAchievement {
	user_id: number;
	latest_connection_date: Date | null;
}

class FirstConnection extends Achievement {
	constructor() {
		super('firstConnection', 'User first connection', 30);
	}

	async check(res: Response, data: FirstConnectionCheckAchievement): Promise<boolean> {
		if (data.latest_connection_date === null) {
			const check = await UserAchievementController.create({
				user_id: data.user_id,
				achievement_id: this.id
			})
				.catch(() => {
					///
				});
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

export type FirstConnectionName = 'firstConnection';
export default FirstConnection;
