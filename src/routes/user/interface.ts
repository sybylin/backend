import type { Request } from 'express';
import type { Role } from '@prisma/client';

export interface UserRequest extends Request {
	params: {
		name?: string
	},
	body: {
		name: string;
		email: string;
		password: string;
		token: string;
		remember: boolean;
		role: Role
	}
}
