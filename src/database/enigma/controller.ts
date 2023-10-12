import { enigma, serieEnigmaOrder } from 'database/db.instance';
import { Enigma } from '@prisma/client';
import SerieController from 'database/serie/controller';

export default class controller {
	static async create(data: Omit<Enigma, 'id' | 'creation_date' | 'modification_date'>): Promise<Enigma | null | never> {
		if (!data || data && !(await SerieController.isExist(data.serie_id)))
			return null;
		return await enigma.create({
			data: {
				serie_id: data.serie_id,
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

	static async findAll(serie_id: number): Promise<{ enigma: Enigma, order: number }[] | null> {
		return serieEnigmaOrder.findMany({
			where: {
				serie_id
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
		if (!data || !data.id || !data.serie_id || !data.title || !data.description || !data.points || 
			(data && !(await SerieController.isExist(data.serie_id)))
		)
			return null;
		return enigma.update({
			where: {
				id: data.id
			},
			data: {
				serie_id: data.serie_id,
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

	static async delete(id: number): Promise<Enigma> {
		return enigma.delete({
			where: {
				id
			}
		});
	}

	static async isExist(id: number): Promise<boolean> {
		return ((await this.findOne(id)) !== null);
	}
}
