import {  Solution } from '@prisma/client';

type solutionArray = {
	keepOrder: boolean;
	list: string[];
}

type solutionObject = Record<string, string>;

export interface userSolutionInterface {
	type: Solution;
	solution: string | string[] | solutionObject;
}

export interface realSolutionInterface {
	type: Solution,
	solution: string | solutionArray | solutionObject
}

class solution {
	static isString(real: string, user: string) {
		return real.localeCompare(user) === 0;
	}

	static isArray(real: solutionArray, user: string[]): boolean {
		if (real.list.length !== user.length)
			return false;
		return (real.keepOrder)
			? real.list.every((e, i) => e === user[i])
			: real.list.every((e) => user.includes(e));
	}

	static isObject(real: solutionObject, user: solutionObject): boolean {
		for (const keys in real) {
			if (real[keys].localeCompare(user[keys]) !== 0)
				return false;
		}
		return true;
	}
}

const is = (userType: Solution, type: Solution) => userType.localeCompare(type) === 0;

const verify = async (
	realSolution: realSolutionInterface,
	userSolution: userSolutionInterface
): Promise<boolean> => {
	if (is(userSolution.type, Solution.STRING))
		return solution.isString(realSolution.solution as string, userSolution.solution as string);
	if (is(userSolution.type, Solution.ARRAY))
		return solution.isArray(realSolution.solution as solutionArray, userSolution.solution as string[]);
	if (is(userSolution.type, Solution.OBJECT))
		return solution.isObject(realSolution.solution as solutionObject, userSolution.solution as solutionObject);
	return false;
};

export default verify;
