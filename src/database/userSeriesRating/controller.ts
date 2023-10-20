import { userSeriesRating } from 'database/db.instance';
import { UserSeriesRating } from '@prisma/client';

export default class controller {
	static async create(data: UserSeriesRating): Promise<UserSeriesRating | null | never> {
		if (!data)
			return null;
		return userSeriesRating.create({
			data: {
				user_id: data.user_id,
				series_id: data.series_id,
				rating: data.rating
			}
		});
	}

	static async read(user_id: number, series_id: number): Promise<{ rating: number } | null> {
		return userSeriesRating.findUnique({
			where: {
				user_id_series_id: {
					user_id,
					series_id,
				}
			},
			select: {
				rating: true
			}
		});
	}

	static async update(data: UserSeriesRating): Promise<{ rating: number } | null> {
		if (!data)
			return null;
		return userSeriesRating.upsert({
			where: {
				user_id_series_id: {
					user_id: data.user_id,
					series_id: data.series_id,
				}
			},
			create: {
				user_id: data.user_id,
				series_id: data.series_id,
				rating: data.rating
			},
			update: {
				rating: data.rating
			},
			select: {
				rating: true
			}
		});
	}

	static async delete(user_id: number, series_id: number): Promise<boolean> {
		return userSeriesRating.delete({
			where: {
				user_id_series_id: {
					user_id,
					series_id
				}
			},
			select: {
				rating: true
			}
		}) !== null;
	}
}
