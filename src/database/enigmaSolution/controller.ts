import { enigmaSolution } from 'database/db.instance';
import { EnigmaSolution, Solution } from '@prisma/client';
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
		
	static async find(enigma_id: number): Promise<{ type: Solution, solution: string } | null> {
		return enigmaSolution.findUnique({
			where: {
				enigma_id
			},
			select: {
				type: true,
				solution: true
			}
		});
	}
	
	static async update(data: EnigmaSolution): Promise<boolean | null> {
		if (!data || !data.enigma_id || !data.solution ||
			(data && !(await EnigmaController.isExist(data.enigma_id)))
		)
			return null;
		return await enigmaSolution.upsert({
			where: {
				enigma_id: data.enigma_id
			},
			update: {
				type: data.type as Solution,
				solution: data.solution
			},
			create: {
				enigma_id: data.enigma_id,
				type: data.type as Solution,
				solution: data.solution
			},
			select: {
				enigma_id: true
			}
		}) !== null;
	}
	
	static async delete(enigma_id: number): Promise<boolean> {
		return await enigmaSolution.delete({
			where: {
				enigma_id
			},
			select: {
				enigma_id: true
			}
		}) !== null;
	}

	static async checkSolution(enigma_id: number, solution: unknown): Promise<boolean | null> {
		const enigmaSolution = await this.find(enigma_id);
		return enigmaSolution
			? compareSolution(enigmaSolution, solution)
			: null;
	}
}
