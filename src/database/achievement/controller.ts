import { achievement } from 'database/db.instance';
import { Achievement } from '@prisma/client';
import AchievementCreatorController from 'database/achievementCreator/controller';

export default class controller {
	static async create(data: Achievement, user_id: number): Promise<Achievement | null | never> {
		if (!data || !data.description || !data.name || !data.point)
			return null;
		const newAchievement = await achievement.create({
			data: {
				name: data.name,
				description: data.description,
				image: data.image,
				point: data.point
			}
		});
		await AchievementCreatorController.create(newAchievement.id, user_id);
		return newAchievement;
	}
	
	static async findOne(idOrName: number | string): Promise<Achievement | null> {
		if (typeof(idOrName) === 'number') {
			return achievement.findUnique({
				where: {
					id: idOrName
				}
			});
		}
		return achievement.findUnique({
			where: {
				name: idOrName
			}
		});
	}

	static async findAll(): Promise<Achievement[] | null> {
		return achievement.findMany();
	}

	static async update(data: Achievement): Promise<Achievement | null> {
		if (!data || !data.description || !data.name || !data.point)
			return null;
		return achievement.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				description: data.description,
				image: data.image,
				point: data.point
			}
		});
	}

	static async delete(idOrName: number | string): Promise<Achievement> {
		if (typeof(idOrName) === 'number') {
			return achievement.delete({
				where: {
					id: idOrName
				}
			});
		}
		return achievement.delete({
			where: {
				name: idOrName
			}
		});
	}

	static async isExist(id: number): Promise<boolean> {
		return ((await this.findOne(id)) !== null);
	}
}
