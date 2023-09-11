import { userResetPassword } from 'database/db.instance';
import { UserResetPassword } from '@prisma/client';

export default class controller {
	static async create(data: UserResetPassword): Promise<UserResetPassword | null | never> {
		if (!data)
			return null;
		return userResetPassword.create({
			data: {
				...data
			}
		});
	}

	static async read(user_id: number): Promise<UserResetPassword | UserResetPassword[] | null> {
		return userResetPassword.findMany({
			where: {
				user_id
			}
		});
	}

	static async update(data: UserResetPassword): Promise<UserResetPassword | null> {
		if (!data)
			return null;
		return userResetPassword.update({
			where: {
				user_id_token: {
					user_id: data.user_id,
					token: data.token
				}
			},
			data: {
				...data
			}
		});
	}

	static async delete(data: UserResetPassword): Promise<UserResetPassword> {
		return userResetPassword.delete({
			where: {
				user_id_token: {
					user_id: data.user_id,
					token: data.token
				}
			},
		});
	}

	static async deletePassedToken(): Promise<void> {
		const currentDate = new Date();

		userResetPassword.deleteMany({
			where: {
				deadline: {
					lt: currentDate
				}
			}
		});
	}

	static async findByToken(searchToken: string): Promise<UserResetPassword | UserResetPassword[] | null> {
		return userResetPassword.findMany({
			where: {
				token: searchToken
			},
			orderBy: [
				{
					deadline: 'desc'
				}
			]
		});
	}

	static async tokenIsValid(searchToken: string): Promise<boolean> {
		const currentTime = new Date().getTime();
		const tokens = await this.findByToken(searchToken);
		let token: UserResetPassword | null = null;

		if (!tokens)
			return false;
		if (Array.isArray(tokens)) {
			const temp = tokens.filter((e) => e.deadline.getTime() >= currentTime);
			token = (!temp.length)
				? null
				: temp[0];
		} else {
			token = (tokens.deadline.getTime() >= currentTime)
				? tokens
				: null;
		}
	
		return !!token;
	}
}
