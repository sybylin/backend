import AchievementController from 'database/achievement/controller';
import type { Response } from 'express';

export const AchievementHeader = 'X-Achievement';

export default abstract class Achievement {
	public name: string;
	public description: string;
	public points: number;
	public id: number;

	constructor(name: string, description: string, points: number) {
		this.name = name;
		this.description = description;
		this.points = points;
		this.id = 0;

		AchievementController.create({
			name: this.name,
			description: this.description,
			points: this.points
		}, 0)
			.then((d) => {
				if (d)
					this.id = d.id;
			})
			.catch(() => {
				///
			});
	}

	attachHeader(res: Response): void {
		res.append(AchievementHeader, this.name);
	}

	abstract check(res: Response, data: unknown): Promise<boolean>;

	abstract ownedToUser(user_id: number): Promise<boolean>;

	abstract removeToUser(user_id: number): Promise<unknown>;
}
