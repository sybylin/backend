import { enigma } from 'database/db.instance';
import { Enigma } from '@prisma/client';
import SeriesController from 'database/series/controller';
import EnigmaCreatorController from 'database/enigmaCreator/controller';
	
export default class controller {
	static async create(data: Enigma, user_id: number): Promise<Enigma | null | never> {
		if (!data || !data.series_id || !data.title || !data.description || !data.point ||
			(data && !(await SeriesController.isExist(data.series_id)))
		)
			return null;
		const newEnigma = await enigma.create({
			data: {
				series_id: data.series_id,
				title: data.title,
				image: data.image,
				description: data.description,
				point: data.point
			}
		});
		await EnigmaCreatorController.create({ enigma_id: newEnigma.id, user_id });
		return newEnigma;
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
	
	static async findAll(series_id: number): Promise<Enigma[] | null> {
		return enigma.findMany({
			where: {
				series_id
			},
			include: {
				enigma_solution: true
			},
			orderBy: [
				{
					creation_date: 'asc'
				},
				{
					modification_date: 'asc'
				}
			]
		});
	}
	
	static async update(data: Enigma): Promise<Enigma | null> {
		if (!data || !data.id || !data.series_id || !data.title || !data.description || !data.point || 
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
				point: data.point
			}
		});
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
