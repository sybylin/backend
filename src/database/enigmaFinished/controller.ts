import { enigmaFinished } from 'database/db.instance';
import { EnigmaFinished } from '@prisma/client';
import EnigmaController from 'database/enigma/controller';
import UserController from 'database/user/controller';

export default class controller {
	static async create(data: Omit<EnigmaFinished, 'completion_date'>): Promise<EnigmaFinished | null | never> {
		if (!data || !data.enigma_id || !data.user_id ||
			(data && !(await EnigmaController.isExist(data.enigma_id))) ||
			(data && !(await UserController.isExist(data.user_id)))
		)
			return null;
		const isExist = await enigmaFinished.findUnique({ where: { enigma_id_user_id: { enigma_id: data.enigma_id, user_id: data.user_id }}, select: { completion_date: true } }) !== null;
		if (!isExist) {
			return enigmaFinished.create({
				data: {
					enigma_id: data.enigma_id,
					user_id: data.user_id
				}
			});
		} else
			return null;
	}

	static async findOne(enigma_id: number, user_id: number): Promise<EnigmaFinished | null> {
		return enigmaFinished.findUnique({
			where: {
				enigma_id_user_id: {
					enigma_id,
					user_id
				}
			}
		});
	}

	static async findAll(type: 'enigma' | 'user', id: number): Promise<EnigmaFinished[] | null> {
		return enigmaFinished.findMany({
			where: (type === 'enigma')
				? { enigma_id: id }
				: { user_id: id },
			orderBy: [
				{
					completion_date: 'asc'
				}
			]
		});
	}
	
	static async delete(enigma_id: number, user_id: number): Promise<EnigmaFinished> {
		return enigmaFinished.delete({
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
