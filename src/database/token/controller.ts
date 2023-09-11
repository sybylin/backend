import { token } from 'database/db.instance';
import { Token } from '@prisma/client';

export default class controller {
	static async create(data: { user_id: number, token: string, deadline: Date, is_invalid?: boolean }): Promise<Token | null | never> {
		if (!data)
			return null;
		return token.create({
			data: {
				user_id: data.user_id,
				token: data.token,
				is_invalid: data.is_invalid ?? false,
				deadline: data.deadline
			}
		});
	}

	static async read(id: number): Promise<Token | Token[] | null> {
		return token.findMany({
			where: {
				id
			}
		});
	}

	static async update(data: Token): Promise<Token | null> {
		if (!data)
			return null;
		return token.update({
			where: {
				id: data.id
			},
			data: {
				id: data.id,
				token: data.token,
				is_invalid: data.is_invalid,
				deadline: data.deadline
			}
		});
	}

	static async delete(id: number): Promise<Token> {
		return token.delete({
			where: {
				id
			}
		});
	}

	static async deletePassedToken(): Promise<void> {
		const currentDate = new Date();

		token.deleteMany({
			where: {
				deadline: {
					lt: currentDate
				}
			}
		});
	}

	static async invalidateToken(searchToken: string): Promise<void | null> {
		const tokens = await this.findByToken(searchToken);

		if (tokens) {
			if (Array.isArray(tokens)) {
				for (const token of tokens)
					this.update({ id: token.id, user_id: token.user_id, token: token.token, is_invalid: true, deadline: token.deadline });
			} else
				this.update({ id: tokens.id, user_id: tokens.user_id, token: tokens.token, is_invalid: true, deadline: tokens.deadline });
		}
	}

	static async findByToken(searchToken: string): Promise<Token | Token[] | null> {
		return token.findMany({
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

	static async tokenIsValid(searchToken: string, userId?: number): Promise<boolean> {
		const currentTime = new Date().getTime();
		const tokens = await this.findByToken(searchToken);
		let token: Token | null = null;

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

		if (userId)
			return (token && token.is_invalid === false && token.user_id === userId) ?? false;
		return (token && token.is_invalid === false) ?? false;
	}
}
