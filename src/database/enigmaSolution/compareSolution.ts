import { isEqual } from 'lodash';
import { EnigmaSolution } from '@prisma/client';

const Solution = {
	STRING: 'STRING',
	ARRAY: 'ARRAY',
	OBJECT: 'OBJECT',
};
type Solution = (typeof Solution)[keyof typeof Solution];
type Obj = Record<string | number | symbol, unknown>;

class solution {
	static isString(real: string, user: string) {
		return real.localeCompare(user) === 0;
	}

	static isArray(real: unknown[], user: unknown[]): boolean {
		return real.length === user.length && real.every((e, i) => e === user[i]);
	}

	static isObject(real: Obj, user: Obj): boolean {
		return isEqual(real, user);
	}
}

export default (enigma_solution: EnigmaSolution, user_solution: unknown): Promise<boolean> => {
	return new Promise((res, rej) => {
		if (enigma_solution.type.localeCompare(Solution.STRING) === 0)
			return res(solution.isString(enigma_solution.solution, user_solution as string));
		else if (enigma_solution.type.localeCompare(Solution.ARRAY) === 0)
			return res(solution.isArray(JSON.parse(enigma_solution.solution) as unknown[], JSON.parse(user_solution as string) as unknown[]));
		else if (enigma_solution.type.localeCompare(Solution.OBJECT) === 0)
			return res(solution.isObject(JSON.parse(enigma_solution.solution) as Obj, JSON.parse(user_solution as string) as Obj));
		else
			rej(`${enigma_solution.type} type not supported`);
	});
};
