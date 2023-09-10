import { userInvalidToken } from 'database/db.instance';
import { UserInvalidToken } from '@prisma/client';
	
export default class controller {
	static async create(data: UserInvalidToken): Promise<UserInvalidToken | null | never> {
		if (!data)
			return null;
		return userInvalidToken.create({
			data: {
				user_id: data.user_id,
				token: data.token,
				deadline: data.deadline
			}
		});
	}

	static async read(userId: number, joinUser = false): Promise<UserInvalidToken | UserInvalidToken[]> {
		return userInvalidToken.findMany({
			where: {
				id: userId
			},
			include: {
				user: joinUser
			},
			orderBy: [
				{
					deadline: 'desc'
				}
			]
		});
	}

	static async update(data: UserInvalidToken): Promise<UserInvalidToken | null> {
		if (!data)
			return null;
		return userInvalidToken.update({
			where: {
				id: data.id
			},
			data: {
				user_id: data.user_id,
				token: data.token,
				deadline: data.deadline
			}
		});
	}

	static async delete(id: number): Promise<UserInvalidToken> {
		return userInvalidToken.delete({
			where: {
				id
			}
		});
	}

	static async isValid(userId: number, token: string): Promise<boolean> {
		const tokens = await userInvalidToken.findMany({
			where: {
				user_id: userId,
				token
			},
			select: {
				deadline: true
			},
			orderBy: [
				{
					deadline: 'desc'
				}
			]
		});

		return (
			!tokens ||
			tokens[0].deadline.getTime() < new Date().getTime()
		);
	}
}
