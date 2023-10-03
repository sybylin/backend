import { serieEnigmaOrder } from 'database/db.instance';
import { SerieEnigmaOrder } from '@prisma/client';
import SerieController from 'database/serie/controller';
import EnigmaController from 'database/enigma/controller';

	
export default class controller {
	static async create(data: SerieEnigmaOrder): Promise<SerieEnigmaOrder | null | never> {
		if (!data || !data.enigma_id || !data.order || !data.serie_id ||
			(data && !await SerieController.isExist(data.serie_id)) ||
			(data && !await EnigmaController.isExist(data.enigma_id))
		)
			return null;
		return serieEnigmaOrder.create({
			data: {
				serie_id: data.serie_id,
				order: data.order,
				enigma_id: data.enigma_id
			}
		});
	}

	static async findAllEnigma(serie_id: number): Promise<SerieEnigmaOrder[] | null> {
		return serieEnigmaOrder.findMany({
			where: {
				serie_id
			},
			include: {
				enigma: {
					include: {
						enigma_solution: true
					}
				}
			},
			orderBy: [
				{
					order: 'asc'
				}
			]
		});
	}
	
	static async findOneEnigma(serie_id: number, enigma_id: number): Promise<SerieEnigmaOrder[] | null> {
		return serieEnigmaOrder.findMany({
			where: {
				serie_id,
				enigma_id
			},
			include: {
				enigma: {
					include: {
						enigma_solution: true
					}
				}
			}
		});
	}
	
	static async findAll(): Promise<SerieEnigmaOrder[] | null> {
		return serieEnigmaOrder.findMany({
			orderBy: [
				{
					serie_id: 'asc'
				},
				{
					order: 'asc'
				}
			]
		});
	}
	
	static async update(data: SerieEnigmaOrder): Promise<SerieEnigmaOrder | null> {
		if (!data || !data.enigma_id || !data.order || !data.serie_id ||
			(data && !await SerieController.isExist(data.serie_id)) ||
			(data && !await EnigmaController.isExist(data.enigma_id))
		)
			return null;
		return serieEnigmaOrder.update({
			where: {
				serie_id_enigma_id: {
					serie_id: data.serie_id,
					enigma_id: data.enigma_id
				}
			},
			data: {
				serie_id: data.serie_id,
				order: data.order,
				enigma_id: data.enigma_id
			}
		});
	}
	
	static async updateOrder(newOrder: { serie_id: number, enigma_id: number }[]): Promise<boolean | null> {
		if (!newOrder || !newOrder.length)
			return null;
		
		for (const [index, data] of newOrder.entries()) {
			await serieEnigmaOrder.update({
				where: {
					serie_id_enigma_id: {
						serie_id: data.serie_id,
						enigma_id: data.enigma_id
					}
				},
				data: {
					order: index + 1,
				},
				select: {
					order: true
				}
			});
		}
		return true;
	}

	static async delete(serie_id: number, enigma_id: number): Promise<SerieEnigmaOrder> {
		return serieEnigmaOrder.delete({
			where: {
				serie_id_enigma_id: {
					serie_id,
					enigma_id
				}
			}
		});
	}
}
