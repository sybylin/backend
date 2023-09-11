import type { Request } from 'express';

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

export const Role = {
	USER: 'USER',
	MODERATOR: 'MODERATOR',
	ADMINISTRATOR: 'ADMINISTRATOR'
};

export type Role = (typeof Role)[keyof typeof Role]
