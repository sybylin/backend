import { enigma, seriesEnigmaOrder } from 'database/db.instance';
import { Enigma } from '@prisma/client';
import SeriesController from 'database/series/controller';

export default class controller {
	static async create(data: Omit<Enigma, 'id' | 'creation_date' | 'modification_date'>): Promise<Enigma | null | never> {
		if (!data || data && !(await SeriesController.isExist(data.series_id)))
			return null;
		return await enigma.create({
			data: {
				series_id: data.series_id,
				title: data.title,
				image: data.image,
				description: data.description,
				points: data.points
			}
		});
	}

	static async findOne(id: number): Promise<Enigma | null> {
		return enigma.findUnique({
			where: {
				id
			},
			include: {
				enigma_solution: true
			}
		});
	}

	static async findOneInfo(id: number): Promise<{ title: string, image: string | null, description: string } | null> {
		return enigma.findUnique({
			where: {
				id
			},
			select: {
				title: true,
				image: true,
				description: true
			}
		});
	}

	static async findAll(series_id: number): Promise<{ enigma: Enigma, order: number }[] | null> {
		return seriesEnigmaOrder.findMany({
			where: {
				series_id
			},
			select: {
				enigma: true,
				order: true
			},
			orderBy: [
				{
					order: 'asc'
				}
			]
		});
	}

	static async update(data: Enigma): Promise<Enigma | null> {
		if (!data || !data.id || !data.series_id || !data.title || !data.description || !data.points || 
			(data && !(await SeriesController.isExist(data.series_id)))
		)
			return null;
		return enigma.update({
			where: {
				id: data.id
			},
			data: {
				series_id: data.series_id,
				title: data.title,
				image: data.image,
				description: data.description,
				points: data.points
			}
		});
	}

	static async updatePart(enigma_id: number, part: 'title' | 'description' | 'points' | 'image', data: string | number): Promise<unknown> {
		const obj: Record<string, string | number> = {};
		const select: Record<string, boolean> = {};
		obj[part] = data;
		select[part] = true;
		const ret = await enigma.findUnique({
			where: {
				id: enigma_id
			},
			select
		});
		await enigma.update({
			where: {
				id: enigma_id
			},
			data: obj,
			select
		});
		return ret;
	}

	static async delete(id: number): Promise<{ id: number }> {
		return enigma.delete({
			where: {
				id
			},
			select: {
				id: true
			}
		});
	}

	static async isExist(id: number): Promise<boolean> {
		return ((await this.findOne(id)) !== null);
	}

	static async thisEnigmaIsCreatedByUser(enigma_id: number, user_id: number): Promise<boolean> {
		return (await enigma.findUnique({
			where: {
				id: enigma_id,
				enigma_creator: {
					some: {
						user_id
					}
				}
			},
			select: {
				id: true
			}
		}) !== null
		);
	}
}
