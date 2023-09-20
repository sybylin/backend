import { writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { argv } from 'process';
import { fileURLToPath } from 'url';

(async() => {
	if (argv.length < 3)
		throw new Error('Pass name of achievement');

	const __dirname = dirname(fileURLToPath(import.meta.url));
	const lower = argv[2].charAt(0).toLowerCase() + argv[2].slice(1);
	const upper = argv[2].charAt(0).toUpperCase() + argv[2].slice(1);
	const data = `import UserAchievementController from 'database/userAchievement/controller';
import { UserAchievement } from '@prisma/client';
import Achievement from 'src/achievement/abstractAchievementClass';
import type { Response } from 'express';
	
interface ${upper}CheckAchievement {
	/// add check interface here
}
	
class ${upper} extends Achievement {
	constructor() {
		super('${lower}', description, points);
	}

	async check(res: Response, data: ${upper}CheckAchievement): Promise<boolean> {
		/// add check code here
		return false;
	}

	async ownedToUser(user_id: number): Promise<boolean> {
		return UserAchievementController.isExist(user_id, this.id);
	}

	async removeToUser(user_id: number): Promise<UserAchievement> {
		return UserAchievementController.delete(user_id, this.id);
	}
}

export type ${upper}Name = '${lower}';
export default ${upper};
`;

	await writeFile(resolve(__dirname, 'list', `${lower}.ts`), data, { flag: 'wx' });
})();
