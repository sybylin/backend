import { userInvalidToken } from 'database/db.instance';
import { UserInvalidToken } from '@prisma/client';
	
export default class controller {
	static async create(data: UserInvalidToken): Promise<UserInvalidToken | null | never> {
		if (!data)
			return null;
		return userInvalidToken.create({
			data: {
				...
			}
		});
	}
		
	static async findOne(idOrName: number | string): Promise<UserInvalidToken | null> {
		if (typeof(idOrName) === 'number') {
			return userInvalidToken.findUnique({
				where: {
					id: idOrName
				}
			});
		}
		return userInvalidToken.findUnique({
			where: {
				name: idOrName
			}
		});
	}
	
	static async findAll(): Promise<UserInvalidToken[] | null> {
		return userInvalidToken.findMany();
	}
	
	static async update(data: UserInvalidToken): Promise<UserInvalidToken | null> {
		if (!data)
			return null;
		return userInvalidToken.update({
			where: {
				id: data.id
			},
			data: {
				...
			}
		});
	}
	
	static async delete(idOrName: number | string): Promise<UserInvalidToken> {
		if (typeof(idOrName) === 'number') {
			return userInvalidToken.delete({
				where: {
					id: idOrName
				}
			});
		}
		return userInvalidToken.delete({
			where: {
				name: idOrName
			}
		});
	}
}
