import { enigmaCreator } from 'database/db.instance';
import { EnigmaCreator } from '@prisma/client';
import UserController from 'database/user/controller';

export default class controller {
	static async create(data: EnigmaCreator): Promise<EnigmaCreator | null | never> {
		if (!data || !data.enigma_id || !data.user_id ||
			(data && !(await UserController.isExist(data.user_id)))
		)
			return null;
		return enigmaCreator.create({
			data: {
				enigma_id: data.enigma_id,
				user_id: data.user_id
			}
		});
	}
		
	static async findOne(enigma_id: number, user_id: number): Promise<EnigmaCreator | null> {
		return enigmaCreator.findUnique({
			where: {
				enigma_id_user_id: {
					enigma_id,
					user_id
				}
			}
		});
	}

	static async findAllOfUser(user_id: number): Promise<EnigmaCreator[] | null> {
		return enigmaCreator.findMany({
			where: {
				user_id
			},
			orderBy: [
				{
					enigma_id: 'asc'
				}
			]
		});
	}
	
	static async delete(enigma_id: number, user_id: number): Promise<EnigmaCreator> {
		return enigmaCreator.delete({
			where: {
				enigma_id_user_id: {
					enigma_id,
					user_id
				}
			}
		});
	}

	static async isFinished(enigma_id: number, user_id: number): Promise<boolean> {
		return (await this.findOne(enigma_id, user_id) !== null);
	}
}
