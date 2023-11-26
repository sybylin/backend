import * as argon2 from 'argon2';
import prisma, { user, enigmaFinished, seriesFinished, userAchievement } from 'database/db.instance';
import checkDate from 'src/database/userBlocked/checkDate';
import { User, Role } from '@prisma/client';

export interface CleanUser {
	id: number;
  name: string;
	email: string;
	avatar: string | null;
	role: Role;
	verify: boolean | null;
	blocked: boolean;
	creation_date: Date | null;
}

export interface FullUser extends CleanUser {
	modification_date: Date | null;
}

export enum enumCheckUser {
	OK = 0,
	NOT_FOUND,
	INCORRECT_PASSWORD,
	ERROR
}

type genCleanUserType = {
	id: number;
	avatar: string | null;
	creation_date: Date | null;
	modification_date: Date | null;
	name: string;
	email: string;
	role: Role;
	verify: boolean | null;
	user_blocked: { end_date: Date } | null;
	end_date?: Date | null;
} | null;
const selectForGenCleanUser = {
	id: true,
	user_blocked: {
		select: {
			end_date: true
		}
	},
	name: true,
	email: true,
	avatar: true,
	role: true,
	verify: true,
	creation_date: true,
	modification_date: true,
};
const genCleanUser = (user: genCleanUserType, cleanUser: boolean): FullUser | CleanUser | null => {
	if (!user)
		return null;
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		avatar: user.avatar,
		role: user.role,
		blocked: (user.end_date)
			? checkDate(user.end_date)
			: (user.user_blocked)
				? checkDate(user.user_blocked.end_date)
				: false,
		verify: user.verify,
		creation_date: user.creation_date,
		modification_date: (!cleanUser)
			? user.modification_date
			: undefined
	};
};

export default class controller {
	static async create(data: Omit<User, 'id' | 'avatar' | 'creation_date' | 'modification_date'>): Promise<{ name: string, email: string } | null> {
		if (!data.name || !data.email || !data.password)
			return null;
		return await user.create({
			data: {
				name: data.name,
				email: data.email,
				avatar: null,
				password: await argon2.hash(data.password),
				verify: data.verify,
				token: data.token,
				token_deadline: data.token_deadline
			},
			select: {
				name: true,
				email: true
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

	static findByEmail(email: string): Promise<User | null> {
		return user.findUnique({
			where: {
				email
			}
		});
	}

	static async cleanFindOneFull(nameOrId: string | number): Promise<FullUser | null> {
		const getUser = await user.findUnique({
			where: (typeof nameOrId === 'number')
				? { id: nameOrId }
				: { name: nameOrId },
			select: selectForGenCleanUser
		});
		return genCleanUser(getUser, false) as FullUser;
	}

	static async cleanFindOne(nameOrId: string | number): Promise<CleanUser | null> {
		const getUser = await user.findUnique({
			where: (typeof nameOrId === 'number')
				? { id: nameOrId }
				: { name: nameOrId },
			select: selectForGenCleanUser
		});
		return genCleanUser(getUser, true) as CleanUser;
	}

	/**
	 * @param page One page contains 100 users
	 * Users order by name, not by id
	 * 
	 * CREATE EXTENSION pg_trgm;
	 */
	static async cleanFindAll(
		sort: { key: 'name' | 'creation_date', value: 'ASC' | 'DESC' },
		lastElement: string,
		search?: string
	): Promise<CleanUser[] | null> {
		const where = [];

		if (lastElement !== null || search)
			where.push('WHERE');
		if (lastElement !== null) {
			where.push(sort.key);
			where.push(sort.value === 'ASC'
				? '>'
				: '<'
			);
			where.push(sort.key === 'creation_date'
				? `timestamp without time zone '${lastElement}'`
				: `'${lastElement}'`);
			if (search)
				where.push('AND');
		}
		if (search)
			where.push(`SIMILARITY(public."User".name, '${search}') > 0.4`);
		return (await prisma.$queryRawUnsafe(`
			SELECT id, name, email, avatar, role, verify, creation_date, end_date
			FROM public."User"
			LEFT JOIN public."UserBlocked" ON public."User".id = public."UserBlocked".user_id
			${where.join(' ')}
			ORDER BY ${sort.key} ${sort.value}
			LIMIT 100
		`) as genCleanUserType[]).map((e)=> genCleanUser(e, true) as CleanUser);
	}

	static async check(
		nameOrId: string | number,
		password: string
	): Promise<{ data: unknown, info: enumCheckUser }> {
		return new Promise((res) => {
			user.findUnique({
				where: (typeof nameOrId === 'number')
					? { id: nameOrId }
					: { name: nameOrId },
				select: {
					id: true,
					password: true,
					last_connection: true
				}
			})
				.then((d) => {
					if (!d)
						return res({ data: null, info: enumCheckUser.NOT_FOUND });
					argon2.verify(d.password, password)
						.then(async (val) => {
							if (val) {
								await user.update({
									where: {
										id: d.id
									},
									data: {
										last_connection: new Date()
									},
									select: {
										id: true
									}
								});
							}
							res({ data: d, info: val
								? enumCheckUser.OK
								: enumCheckUser.INCORRECT_PASSWORD });
						})
						.catch((e) => res({ data: e, info: enumCheckUser.ERROR }));
				})
				.catch((e) => res({ data: e, info: enumCheckUser.ERROR }));
		});
	}

	static async update(
		data: Omit<User, 'avatar' | 'role' | 'creation_date' | 'modification_date' | 'last_connection'>,
		passNotChange: boolean = false
	): Promise<CleanUser> {
		const getUser = await user.update({
			where: {
				id: data.id
			},
			data: (passNotChange)
				? {
					name: data.name,
					email: data.email,
					verify: data.verify,
					token: data.token,
					token_deadline: data.token_deadline
				}
				: {
					name: data.name,
					email: data.email,
					password: await argon2.hash(data.password),
					verify: data.verify,
					token: data.token,
					token_deadline: data.token_deadline
				},
			select: selectForGenCleanUser
		});

		return genCleanUser(getUser, true) as CleanUser;
	}

	static async updatePassword(user_id: number, new_password: string): Promise<boolean> {
		const update = await user.update({
			where: {
				id: user_id
			},
			data: {
				password: await argon2.hash(new_password)
			},
			select: {
				id: true
			}
		});

		return (update !== null);
	}

	static async updateRole(id: number, new_role: Role): Promise<boolean> {
		return await user.update({
			where: {
				id
			},
			data: {
				role: new_role,
			},
			select: {
				id: true
			}
		}) !== null;
	}

	static async updateAvatar(idOrName: number | string, avatar: string): Promise<{ avatar: string | null } | null> {
		const ret = await user.findUnique({
			where: (typeof idOrName === 'number')
				? { id: idOrName }
				: { name: idOrName },
			select: {
				avatar: true
			}
		});
		await user.update({
			where: (typeof idOrName === 'number')
				? { id: idOrName }
				: { name: idOrName },
			data: {
				avatar
			},
			select: {
				avatar: true
			}
		});
		return ret;
	}

	static delete(nameOrId: string | number): Promise<User> {
		return user.delete({
			where: (typeof nameOrId === 'number')
				? { id: nameOrId }
				: { name: nameOrId }
		});
	}

	static async isExist(id: number): Promise<boolean> {
		return ((await user.findUnique({
			where: {
				id
			}
		})) !== null);
	}

	static async userRole(id: number): Promise<Role | null> {
		const userRole = await user.findUnique({
			where: {
				id
			},
			select: {
				role: true
			}
		});

		if (!userRole)
			return null;
		return userRole.role as Role;
	}

	static async getPoints(user_id: number): Promise<number> {
		const achievementPoints = await userAchievement.findMany({
			where: {
				user_id
			},
			select: {
				achievement: {
					select: {
						points: true
					}
				}
			}
		});
		let points = 0;

		points += (await enigmaFinished.count({ where: { user_id } }) ?? 0) * 300;
		points += (await seriesFinished.count({ where: { user_id } }) ?? 0) * 1500;
		if (achievementPoints && Array.isArray(achievementPoints))
			achievementPoints.forEach((e) => points += e.achievement.points);

		return points;
	}
}
