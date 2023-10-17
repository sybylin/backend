import { seriesCreator } from 'database/db.instance';
import { SeriesCreator } from '@prisma/client';
import UserController from 'database/user/controller';
	
export default class controller {
	static async create(data: SeriesCreator): Promise<SeriesCreator | null | never> {
		if (!data || !data.series_id || !data.user_id ||
			(data && !await UserController.isExist(data.user_id))
		)
			return null;
		return seriesCreator.create({
			data: {
				series_id: data.series_id,
				user_id: data.user_id
			}
		});
	}

	static async findOne(series_id: number, user_id: number): Promise<SeriesCreator | null> {
		return seriesCreator.findUnique({
			where: {
				series_id_user_id: {
					series_id,
					user_id
				}
			}
		});
	}
	
	static async findAll(type: 'enigma' | 'user', id: number): Promise<SeriesCreator[] | null> {
		return seriesCreator.findMany({
			where: (type === 'enigma')
				? { series_id: id }
				: { user_id: id }
		});
	}
	
	static async update(old_data: SeriesCreator, new_data: SeriesCreator): Promise<SeriesCreator | null> {
		if (!new_data || !new_data.series_id || !new_data.user_id ||
			(new_data && !await UserController.isExist(new_data.user_id))
		)
			return null;
		return seriesCreator.update({
			where: {
				series_id_user_id: {
					series_id: old_data.series_id,
					user_id: old_data.user_id
				}
			},
			data: {
				series_id: new_data.series_id,
				user_id: new_data.user_id
			}
		});
	}
	
	static async delete(data: SeriesCreator): Promise<SeriesCreator | null> {
		if (!data || !data.series_id || !data.user_id ||
			(data && !await UserController.isExist(data.user_id))
		)
			return null;
		return seriesCreator.delete({
			where: {
				series_id_user_id: {
					series_id: data.series_id,
					user_id: data.user_id
				}
			}
		});
	}
}
