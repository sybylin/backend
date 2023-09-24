import AchievementController from 'database/achievement/controller';
import type { Response } from 'express';

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

	/**
	 * Add achievement to response body
	 */
	add(res: Response): void {
		res.achievements.push({ name: this.name, timestamp: new Date() });
	}

	abstract check(res: Response, data: unknown): Promise<boolean>;

	abstract ownedToUser(user_id: number): Promise<boolean>;

	abstract removeToUser(user_id: number): Promise<unknown>;
}
