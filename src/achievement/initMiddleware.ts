import type { Request, Response, NextFunction } from 'express';

export default (_req: Request, res: Response, next: NextFunction): void => {
	res.achievements = [];
	next();
};
