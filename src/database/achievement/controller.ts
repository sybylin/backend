import { achievement, achievementCreator } from 'database/db.instance';
import { Achievement } from '@prisma/client';

interface isExist {
	id: number;
	name: string;
	description: string;
	points: number;
}

export default class controller {
	static async create(data: Omit<Achievement, 'id' | 'creation_date' | 'modification_date'>, user_id: number): Promise<Achievement | isExist | null | never> {
		if (!data || !data.description || !data.name || !data.points)
			return null;
		const isExist = await achievement.findUnique({
			where: {
				name: data.name
			},
			select: {
				id: true,
				name: true,
				description: true,
				points: true
			}
		});

		if (isExist) {
			if (
				isExist.name.localeCompare(data.name) === 0 &&
				isExist?.description.localeCompare(data.description) === 0 &&
				isExist.points === data.points
			)
				return isExist;

			const getDiff = (from: string | number, to: string | number): string | number => {
				if (typeof from === 'string') {
					return (from.localeCompare(to as string) === 0)
						? from
						: to;
				}
				return (from === to)
					? from
					: to;
			};

			return this.update({
				id: isExist.id,
				name: getDiff(isExist.name, data.name) as string,
				description: getDiff(isExist.description, data.description) as string,
				points: getDiff(isExist.points, data.points) as number,
			});
		}
		const isCreated = await achievement.create({
			data: {
				name: data.name,
				description: data.description,
				points: data.points
			}
		});
		if (!isCreated)
			return null;
		await achievementCreator.create({
			data: {
				achievement_id: isCreated.id,
				user_id
			}
		});
		return isCreated;
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

	static async findAll(): Promise<Omit<Achievement, 'id' | 'creation_date'>[] | null> {
		return achievement.findMany({
			select: {
				name: true,
				description: true,
				points: true,
				modification_date: true
			}
		});
	}

	static async update(data: Omit<Achievement, 'creation_date' | 'modification_date'>): Promise<Achievement | null> {
		if (!data || !data.description || !data.name || !data.points)
			return null;
		return achievement.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				description: data.description,
				points: data.points
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
