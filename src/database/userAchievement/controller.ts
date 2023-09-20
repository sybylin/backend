import { userAchievement } from 'database/db.instance';
import { UserAchievement } from '@prisma/client';
import AchivementController from 'database/achievement/controller';
import UserController from 'database/user/controller';

interface AllForUser {
	unlocking_date: Date | null;
  achievement: {
		name: string;
		points: number;
	};
}

export default class controller {
	static async create(data: Omit<UserAchievement, 'unlocking_date'>): Promise<UserAchievement | null | never> {
		if (!data || !data.achievement_id || !data.user_id ||
			(data && !await AchivementController.isExist(data.achievement_id)) ||
			(data && !await UserController.isExist(data.user_id))
		)
			return null;
		return userAchievement.create({
			data: {
				user_id: data.user_id,
				achievement_id: data.achievement_id,
			}
		});
	}
		
	static async findOne(user_id: number, achievement_id: number): Promise<UserAchievement | null> {
		return userAchievement.findUnique({
			where: {
				user_id_achievement_id: {
					user_id,
					achievement_id
				},
			}
		});
	}

	static async findAll(type: 'achivement' | 'user', id: number): Promise<UserAchievement[] | null> {
		return userAchievement.findMany({
			where: (type === 'achivement')
				? { achievement_id: id }
				: { user_id: id },
			include: {
				achievement: (type === 'achivement'),
				user: (type === 'user')
			},
			orderBy: [
				{
					unlocking_date: 'desc'
				}
			]
		});
	}
	
	static async delete(user_id: number, achievement_id: number): Promise<UserAchievement> {
		return userAchievement.delete({
			where: {
				user_id_achievement_id: {
					user_id,
					achievement_id
				},
			}
		});
	}

	static async isExist(user_id: number, achievement_id: number): Promise<boolean> {
		return ((await this.findOne(user_id, achievement_id)) !== null);
	}

	static async getAllForUser(user_id: number): Promise<AllForUser[]> {
		return userAchievement.findMany({
			where: {
				user_id
			},
			select: {
				unlocking_date: true,
				achievement: {
					select: {
						name: true,
						points: true
					}
				}
			},
			orderBy: [
				{
					achievement: {
						name: 'asc'
					}
				}
			]
		});
	}

	static async getOneForUser(user_id: number, name: string): Promise<AllForUser | null> {
		return userAchievement.findFirst({
			where: {
				user_id,
				achievement: {
					name
				}
			},
			select: {
				unlocking_date: true,
				achievement: {
					select: {
						name: true,
						points: true
					}
				}
			}
		});
	}
}
