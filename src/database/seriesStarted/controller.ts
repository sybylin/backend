import { seriesStarted } from 'database/db.instance';
import { SeriesStarted } from '@prisma/client';

export default class controller {
	static async create(data: Omit<SeriesStarted, 'started_date'>): Promise<boolean | null | never> {
		if (!data)
			return null;
		return seriesStarted.upsert({
			where: {
				series_id_user_id: {
					series_id: data.series_id,
					user_id: data.user_id
				}
			},
			update: {},
			create: {
				series_id: data.series_id,
				user_id: data.user_id
			},
			select: {}
		}) !== null;
	}

	static async read(data: Omit<SeriesStarted, 'started_date'>): Promise<SeriesStarted | null> {
		return seriesStarted.findUnique({
			where: {
				series_id_user_id: {
					series_id: data.series_id,
					user_id: data.user_id
				}
			}
		});
	}

	static async delete(data: Omit<SeriesStarted, 'started_date'>): Promise<SeriesStarted> {
		return seriesStarted.delete({
			where: {
				series_id_user_id: {
					series_id: data.series_id,
					user_id: data.user_id
				}
			}
		});
	}
}
