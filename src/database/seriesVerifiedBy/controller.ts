import { prisma, seriesVerifiedBy } from 'database/db.instance';
import { SeriesVerifiedBy } from '@prisma/client';

export default class controller {
	static async create(series_id: number): Promise<SeriesVerifiedBy | null | never> {
		/**
		 * Psql extension query
		 * 
		 * CREATE EXTENSION tsm_system_time;
		 * CREATE EXTENSION tsm_system_rows;
		 */
		const randomSelectUser: {id: number}[] = await prisma.$queryRaw`
			SELECT id
			FROM public."User" TABLESAMPLE SYSTEM_ROWS(10)
			WHERE role = 'MODERATOR' OR role = 'ADMINISTRATOR'
			ORDER BY RANDOM()
			LIMIT 1
		`;
		return seriesVerifiedBy.create({
			data: {
				series_id: series_id,
				user_id: randomSelectUser[0].id,
				verified: false,
			}
		});
	}

	static async isModeratorOfSeries(series_id: number, user_id: number): Promise<boolean> {
		return await seriesVerifiedBy.findUnique({
			where: {
				series_id,
				user_id
			},
			select: {
				verified: true
			}
		}) !== null;
	}

	static async seriesIsVerified(series_id: number): Promise<boolean> {
		return await seriesVerifiedBy.findUnique({
			where: {
				series_id,
				verified: true
			},
			select: {
				verified: true
			}
		}) !== null;
	}

	static async setVerifiedStatus(data: Omit<SeriesVerifiedBy, 'verified' | 'verified_date'>, verified: boolean): Promise<{ verified: boolean, verified_date: Date | null }> {
		return seriesVerifiedBy.update({
			where: {
				series_id: data.series_id,
				user_id: data.user_id
			},
			select: {
				verified: true,
				verified_date: true
			},
			data: {
				verified
			}
		});
	}

	static async delete(data: Omit<SeriesVerifiedBy, 'verified' | 'verified_date'>): Promise<boolean> {
		return seriesVerifiedBy.delete({
			where: {
				series_id: data.series_id,
				user_id: data.user_id
			},
			select: {
				verified: true
			}
		}) !== null;
	}
}
