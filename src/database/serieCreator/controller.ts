import { serieCreator } from 'database/db.instance';
import { SerieCreator } from '@prisma/client';
import UserController from 'database/user/controller';
	
export default class controller {
	static async create(data: SerieCreator): Promise<SerieCreator | null | never> {
		if (!data || !data.serie_id || !data.user_id ||
			(data && !await UserController.isExist(data.user_id))
		)
			return null;
		return serieCreator.create({
			data: {
				serie_id: data.serie_id,
				user_id: data.user_id
			}
		});
	}

	static async findOne(serie_id: number, user_id: number): Promise<SerieCreator | null> {
		return serieCreator.findUnique({
			where: {
				serie_id_user_id: {
					serie_id,
					user_id
				}
			}
		});
	}
	
	static async findAll(type: 'enigma' | 'user', id: number): Promise<SerieCreator[] | null> {
		return serieCreator.findMany({
			where: (type === 'enigma')
				? { serie_id: id }
				: { user_id: id }
		});
	}
	
	static async update(old_data: SerieCreator, new_data: SerieCreator): Promise<SerieCreator | null> {
		if (!new_data || !new_data.serie_id || !new_data.user_id ||
			(new_data && !await UserController.isExist(new_data.user_id))
		)
			return null;
		return serieCreator.update({
			where: {
				serie_id_user_id: {
					serie_id: old_data.serie_id,
					user_id: old_data.user_id
				}
			},
			data: {
				serie_id: new_data.serie_id,
				user_id: new_data.user_id
			}
		});
	}
	
	static async delete(data: SerieCreator): Promise<SerieCreator | null> {
		if (!data || !data.serie_id || !data.user_id ||
			(data && !await UserController.isExist(data.user_id))
		)
			return null;
		return serieCreator.delete({
			where: {
				serie_id_user_id: {
					serie_id: data.serie_id,
					user_id: data.user_id
				}
			}
		});
	}
}
