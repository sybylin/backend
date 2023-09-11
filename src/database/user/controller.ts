import * as argon2 from 'argon2';
import { user } from 'database/db.instance';
import { User } from '@prisma/client';

interface CleanUser {
	id: number;
  name: string;
  avatar: string | null;
  verify: boolean | null;
  creation_date: Date | null;
  modification_date: Date | null;
}

export default class controller {
	static async create(data: User): Promise<User | null | never> {
		if (!data.name || !data.email || !data.password)
			return null;
		return user.create({
			data: {
				name: data.name,
				email: data.email,
				avatar: data.avatar,
				password: await argon2.hash(data.password),
				verify: data.verify,
				token: data.token,
				token_deadline: data.token_deadline
			}
		});
	}

	static findOne(nameOrId: string | number): Promise<User | null> {
		return user.findUnique({
			where: (typeof nameOrId === 'number')
				? { id: nameOrId }
				: { name: nameOrId }
		});
	}

	static async cleanFindOne(name: string): Promise<CleanUser | null> {
		return user.findUnique({
			where: {
				name
			},
			select: {
				id: true,
				name: true,
				avatar: true,
				verify: true,
				creation_date: true,
				modification_date: true
			}
		});
	}

	/**
	 * @param page One page contains 100 users
	 * Users order by creation_date, not by id
	 */
	static async cleanFindAll(page?: number): Promise<CleanUser[] | null> {
		const inc = 100;
		const skip = (page && page >= 0)
			? inc * (page - 1)
			: 0;
		
		return user.findMany({
			select: {
				id: true,
				name: true,
				avatar: true,
				verify: true,
				creation_date: true,
				modification_date: true
			},
			skip,
			take: (page)
				? inc
				: undefined,
			orderBy: [
				{
					creation_date: 'desc'
				}
			]
		});
	}

	static async check(nameOrId: string | number, password: string): Promise<null | boolean> {
		return new Promise((res, rej) => {
			user.findUnique({
				where: (typeof nameOrId === 'number')
					? { id: nameOrId }
					: { name: nameOrId }
			})
				.then((d) => {
					if (!d)
						return rej(null);
					argon2.verify(d.password, password)
						.then((val) => res(val))
						.catch(() => rej(null));
				})
				.catch(() => rej(null));
		});
	}

	static async update(data: User, passNotChange: boolean = false): Promise<User> {
		return user.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				email: data.email,
				avatar: data.avatar,
				password: (passNotChange)
					? await argon2.hash(data.password)
					: data.password,
				verify: data.verify,
				token: data.token,
				token_deadline: data.token_deadline
			}
		});
	}

	static async updatePassword(user_id: number, new_password: string): Promise<boolean> {
		const update = await user.update({
			where: {
				id: user_id
			},
			data: {
				password: await argon2.hash(new_password)
			}
		});

		return (update !== null);
	}

	static delete(name: string): Promise<User> {
		return user.delete({
			where: {
				name
			}
		});
	}

	static async isExist(id: number): Promise<boolean> {
		return ((await user.findUnique({
			where: {
				id
			}
		})) !== null);
	}
}
