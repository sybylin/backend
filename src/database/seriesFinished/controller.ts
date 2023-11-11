import { enigmaFinished, seriesFinished, seriesEnigmaOrder } from 'database/db.instance';
import { SeriesFinished } from '@prisma/client';
	
export default class controller {
	static async create(data: Omit<SeriesFinished, 'completion_date'>): Promise<SeriesFinished | null | never> {
		if (!data || !data.series_id || !data.user_id)
			return null;
		return seriesFinished.create({
			data: {
				series_id: data.series_id,
				user_id: data.user_id
			}
		});
	}
		
	static async findOne(series_id: number, user_id: number): Promise<SeriesFinished | null> {
		return seriesFinished.findUnique({
			where: {
				series_id_user_id: {
					series_id,
					user_id
				}
			}
		});
	}
	
	static async findAll(type: 'series' | 'user', id: number): Promise<SeriesFinished[] | null> {
		if (type === 'series') {
			return seriesFinished.findMany({
				where: {
					series_id: id
				},
				orderBy: [
					{
						completion_date: 'desc'
					}
				]
			});
		}
		return seriesFinished.findMany({
			where: {
				user_id: id
			},
			orderBy: [
				{
					completion_date: 'desc'
				}
			]
		});
	}
	
	static async delete(series_id: number, user_id: number): Promise<SeriesFinished> {
		return seriesFinished.delete({
			where: {
				series_id_user_id: {
					series_id,
					user_id
				}
			}
		});
	}

	static async isFinished(series_id: number, user_id: number): Promise<'already' | boolean> {
		if (await this.findOne(series_id, user_id))
			return 'already';
		if (
			(await seriesEnigmaOrder.count({ where: { series_id } })) ===
			(await enigmaFinished.count({
				where: {
					user_id,
					enigma: { series_id }
				}
			}))
		) {
			await this.create({ series_id, user_id });
			return true;
		}
		return false;
	}
}
