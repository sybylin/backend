import { enigmaSolution } from 'database/db.instance';
import { EnigmaSolution } from '@prisma/client';
import EnigmaController from 'database/enigma/controller';
import compareSolution from './compareSolution';
	
export default class controller {
	static async create(data: EnigmaSolution): Promise<EnigmaSolution | null | never> {
		if (!data || !data.enigma_id || !data.solution ||
			(data && !(await EnigmaController.isExist(data.enigma_id)))
		)
			return null;
		return enigmaSolution.create({
			data: {
				enigma_id: data.enigma_id,
				solution: data.solution
			}
		});
	}
		
	static async find(enigma_id: number): Promise<EnigmaSolution | null> {
		return enigmaSolution.findUnique({
			where: {
				enigma_id
			}
		});
	}
	
	static async update(data: EnigmaSolution): Promise<EnigmaSolution | null> {
		if (!data || !data.enigma_id || !data.solution ||
			(data && !(await EnigmaController.isExist(data.enigma_id)))
		)
			return null;
		return enigmaSolution.update({
			where: {
				enigma_id: data.enigma_id
			},
			data: {
				enigma_id: data.enigma_id,
				solution: data.solution
			}
		});
	}
	
	static async delete(enigma_id: number): Promise<EnigmaSolution> {
		return enigmaSolution.delete({
			where: {
				enigma_id
			}
		});
	}

	static async checkSolution(enigma_id: number, solution: unknown): Promise<boolean | null> {
		const enigmaSolution = await this.find(enigma_id);
		return enigmaSolution
			? compareSolution(enigmaSolution, solution)
			: null;
	}
}
