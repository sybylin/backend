import type { CleanUser } from './database/user/controller';

declare global {
	namespace Express {
		interface Request {
			user?: CleanUser
		}
		interface Response {
			achievements: { name: string, timestamp: Date }[]
		}
	}
}
