import { writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { argv } from 'process';
import { fileURLToPath } from 'url';

(async() => {
	if (argv.length < 3)
		throw new Error('Pass name of achievement');

	const __dirname = dirname(fileURLToPath(import.meta.url));
	const name = argv[2].charAt(0).toLowerCase() + argv[2].slice(1);
	const data = `import type { Request, Response, NextFunction } from 'express';

export default {
	name: '${name}',
	fn: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		// add condition for achievement
	}
};
`;

	await writeFile(resolve(__dirname, 'list', `${name}.ts`), data, { flag: 'wx' });
})();
