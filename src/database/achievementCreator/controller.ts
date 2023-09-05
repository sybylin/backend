import { achievementCreator } from 'database/db.instance';
import { AchievementCreator } from '@prisma/client';

export default class controller {
	static async create(achievement_id: number, user_id: number): Promise<AchievementCreator | null | never> {
		return achievementCreator.create({
			data: {
				achievement_id,
				user_id
			}
		});
	}
	
	static async findOne(achievement_id: number): Promise<AchievementCreator | null> {
		return achievementCreator.findUnique({
			where: {
				achievement_id
			}
		});
	}

	static async findAll(type: 'achievement' | 'user', id: number): Promise<AchievementCreator[] | null> {
		return achievementCreator.findMany({
			include: {
				achievement: {
					select: {
						creation_date: true
					}
				}
			},
			where: (type === 'achievement')
				? { achievement_id: id }
				: { user_id: id },
			orderBy: {
				achievement: {
					creation_date: 'asc'
				}
			}
		});
	}

	static async update(
		achievement_id: number,
		user_id: number,
		new_user_id: number
	): Promise<AchievementCreator | null> {
		return achievementCreator.update({
			where: {
				achievement_id_user_id: {
					achievement_id,
					user_id
				}
			},
			data: {
				user_id: new_user_id
			}
		});
	}

	static async delete(achievement_id: number, user_id: number): Promise<AchievementCreator> {
		return achievementCreator.delete({
			where: {
				achievement_id_user_id: {
					achievement_id,
					user_id
				}
			}
		});
	}

	static async isExist(id: number): Promise<boolean> {
		return ((await this.findOne(id)) !== null);
	}
}
