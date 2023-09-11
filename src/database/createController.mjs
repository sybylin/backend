import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { argv } from 'process';
import { fileURLToPath } from 'url';

(async() => {
	if (argv.length < 3)
		throw new Error('Pass name of database');

	const up = (s) => s.charAt(0).toUpperCase() + s.slice(1);
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const name = argv[2].charAt(0).toLowerCase() + argv[2].slice(1);
	const data = `import { ${name} } from 'database/db.instance';
import { ${up(name)} } from '@prisma/client';

export default class controller {
	static async create(data: ${up(name)}): Promise<${up(name)} | null | never> {
		if (!data)
			return null;
		return ${name}.create({
			data: {
				...
			}
		});
	}

	static async read(id: number): Promise<${up(name)} | ${up(name)}[] | null> {
		return ${name}.findMany({
			where: {
				id
			}
		});
	}

	static async findAll(): Promise<${up(name)}[] | null> {
		return ${name}.findMany();
	}

	static async update(data: ${up(name)}): Promise<${up(name)} | null> {
		if (!data)
			return null;
		return ${name}.update({
			where: {
				id: data.id
			},
			data: {
				...
			}
		});
	}

	static async delete(idOrName: number | string): Promise<${up(name)}> {
		if (typeof(idOrName) === 'number') {
			return ${name}.delete({
				where: {
					id: idOrName
				}
			});
		}
		return ${name}.delete({
			where: {
				name: idOrName
			}
		});
	}
}
`;

	await mkdir(resolve(__dirname, name));
	await writeFile(resolve(__dirname, name, 'controller.ts'), data, { flag: 'wx' });
})();
