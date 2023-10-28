import { enigmaSolution } from 'database/db.instance';
import { EnigmaSolution, Solution } from '@prisma/client';
import EnigmaController from 'database/enigma/controller';
import compareSolution from './compareSolution';
import type { userSolutionInterface, realSolutionInterface } from './compareSolution';
	
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

	static async findType(enigma_id: number): Promise<{ type: Solution } | null> {
		return enigmaSolution.findUnique({
			where: {
				enigma_id
			},
			select: {
				type: true
			}
		});
	}

	static async getListOfKeys(enigma_id: number): Promise<string[] | null> {
		const enigma = await enigmaSolution.findUnique({
			where: {
				enigma_id,
				type: 'OBJECT'
			},
			select: {
				solution: true
			}
		});
		if (!enigma)
			return null;
		return Object.entries(JSON.parse(enigma.solution)).map((e) => e[0]);
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

	static async checkSolution(enigma_id: number, userSolution: userSolutionInterface): Promise<boolean | null> {
		const realSolution = await this.find(enigma_id);
		if (!realSolution || !enigmaSolution)
			return null;
		return compareSolution(
			{
				type: realSolution.type,
				solution: JSON.parse(realSolution.solution)
			} as realSolutionInterface,
			userSolution
		);
	}
}
