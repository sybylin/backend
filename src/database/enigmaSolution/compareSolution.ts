import { isEqual } from 'lodash';
import {  Solution } from '@prisma/client';

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

export default (enigma_solution: { type: Solution, solution: string }, user_solution: unknown): Promise<boolean> => {
	const is = (type: Solution) => enigma_solution.type.localeCompare(type) === 0;

	return new Promise((res, rej) => {
		if (is(Solution.STRING))
			return res(solution.isString(enigma_solution.solution, user_solution as string));
		else if (is(Solution.ARRAY))
			return res(solution.isArray(JSON.parse(enigma_solution.solution) as unknown[], JSON.parse(user_solution as string) as unknown[]));
		else if (is(Solution.OBJECT))
			return res(solution.isObject(JSON.parse(enigma_solution.solution) as Obj, JSON.parse(user_solution as string) as Obj));
		else
			rej(`${enigma_solution.type} type not supported`);
	});
};
