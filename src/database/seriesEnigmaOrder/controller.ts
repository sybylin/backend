import { seriesEnigmaOrder } from 'database/db.instance';
import { SeriesEnigmaOrder } from '@prisma/client';
import SeriesController from 'database/series/controller';
import EnigmaController from 'database/enigma/controller';

	
export default class controller {
	static async create(data: SeriesEnigmaOrder): Promise<SeriesEnigmaOrder | null | never> {
		if (!data || !data.enigma_id || !data.order || !data.series_id ||
			(data && !await SeriesController.isExist(data.series_id)) ||
			(data && !await EnigmaController.isExist(data.enigma_id))
		)
			return null;
		return seriesEnigmaOrder.create({
			data: {
				series_id: data.series_id,
				order: data.order,
				enigma_id: data.enigma_id
			}
		});
	}

	static async findAllEnigma(series_id: number): Promise<SeriesEnigmaOrder[] | null> {
		return seriesEnigmaOrder.findMany({
			where: {
				series_id
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
	
	static async findOneEnigma(series_id: number, enigma_id: number): Promise<SeriesEnigmaOrder[] | null> {
		return seriesEnigmaOrder.findMany({
			where: {
				series_id,
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
	
	static async findAll(): Promise<SeriesEnigmaOrder[] | null> {
		return seriesEnigmaOrder.findMany({
			orderBy: [
				{
					series_id: 'asc'
				},
				{
					order: 'asc'
				}
			]
		});
	}
	
	static async update(data: SeriesEnigmaOrder): Promise<SeriesEnigmaOrder | null> {
		if (!data || !data.enigma_id || !data.order || !data.series_id ||
			(data && !await SeriesController.isExist(data.series_id)) ||
			(data && !await EnigmaController.isExist(data.enigma_id))
		)
			return null;
		return seriesEnigmaOrder.update({
			where: {
				series_id_enigma_id: {
					series_id: data.series_id,
					enigma_id: data.enigma_id
				}
			},
			data: {
				series_id: data.series_id,
				order: data.order,
				enigma_id: data.enigma_id
			}
		});
	}
	
	static async updateOrder(series_id: number, newOrder: number[]): Promise<boolean | null> {
		if (!newOrder || !newOrder.length)
			return null;
		for (const [index, data] of newOrder.entries()) {
			await seriesEnigmaOrder.update({
				where: {
					series_id_enigma_id: {
						series_id: series_id,
						enigma_id: data
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

	static async delete(series_id: number, enigma_id: number): Promise<SeriesEnigmaOrder> {
		return seriesEnigmaOrder.delete({
			where: {
				series_id_enigma_id: {
					series_id,
					enigma_id
				}
			}
		});
	}
}
