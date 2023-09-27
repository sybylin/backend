import { serieFinished } from 'database/db.instance';
import { SerieFinished } from '@prisma/client';
	
export default class controller {
	static async create(data: SerieFinished): Promise<SerieFinished | null | never> {
		if (!data || !data.serie_id || !data.user_id)
			return null;
		return serieFinished.create({
			data: {
				serie_id: data.serie_id,
				user_id: data.user_id
			}
		});
	}
		
	static async findOne(serie_id: number, user_id: number): Promise<SerieFinished | null> {
		return serieFinished.findUnique({
			where: {
				serie_id_user_id: {
					serie_id,
					user_id
				}
			}
		});
	}
	
	static async findAll(type: 'series' | 'user', id: number): Promise<SerieFinished[] | null> {
		if (type === 'series') {
			return serieFinished.findMany({
				where: {
					serie_id: id
				},
				orderBy: [
					{
						completion_date: 'desc'
					}
				]
			});
		}
		return serieFinished.findMany({
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
	
	static async delete(serie_id: number, user_id: number): Promise<SerieFinished> {
		return serieFinished.delete({
			where: {
				serie_id_user_id: {
					serie_id,
					user_id
				}
			}
		});
	}

	static async isFinished(serie_id: number, user_id: number): Promise<boolean> {
		return ((await this.findOne(serie_id, user_id)) !== null);
	}
}
