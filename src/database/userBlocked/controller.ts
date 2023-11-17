import { userBlocked } from 'database/db.instance';
import { UserBlocked } from '@prisma/client';
import checkDate from './checkDate';

export default class controller {
	static async create(data: UserBlocked): Promise<UserBlocked | null | never> {
		if (!data)
			return null;
		return this.update(data);
	}

	static async isBlocked(user_id: number): Promise<boolean> {
		const getDate = await userBlocked.findUnique({
			where: {
				user_id
			},
			select: {
				end_date: true
			}
		});
		if (!getDate)
			return false;
		return checkDate(getDate.end_date);
	}

	static async update(data: UserBlocked): Promise<UserBlocked | null> {
		return userBlocked.upsert({
			where: {
				user_id: data.user_id,
			},
			create: {
				user_id: data.user_id,
				blocked_by: data.blocked_by,
				end_date: data.end_date
			},
			update: {
				user_id: data.user_id,
				blocked_by: data.blocked_by,
				end_date: data.end_date
			}
		});
	}

	static async delete(user_id: number): Promise<boolean> {
		return await userBlocked.delete({
			where: {
				user_id
			},
			select: {
				user_id: true
			}
		}) !== null;
	}
}
