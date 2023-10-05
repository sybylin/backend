import { error } from '@/code/format';
import { log } from '@/lib/log.js';
import { MailError } from '@/lib/mail';
import { Prisma } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';

class BackendError extends Error {
	public name = 'BackendError';
	public message: string;
	public code: number;

	constructor (message: string, code: number) {
		super(message);
		this.message = message;
		this.code = code;
	}
}

export default class error500 {
	static prisma (err: Prisma.PrismaClientKnownRequestError): BackendError {
		switch (err.code) {
		case 'P2002':
			// handling duplicate key errors
			return new BackendError(`Duplicate field value: ${err.meta?.target}`, 400);
		case 'P2014':
			// handling invalid id errors
			return new BackendError(`Invalid ID: ${err.meta?.target}`, 400);
		case 'P2003':
			// handling invalid data errors
			return new BackendError(`Invalid input data: ${err.meta?.target}`, 400);
		default:
			// handling all other errors
			return new BackendError(`Something went wrong: ${err.message}`, 500);
		}
	}

	static jwt (expired = false): BackendError {
		return new BackendError((expired)
			? 'Token has expired, please login again'
			: 'Invalid token, please login again',
		400);
	}

	static isPrismaError(err: BackendError): boolean {
		return [
			'PrismaClientKnownRequestError',
			'PrismaClientUnknownRequestError',
			'PrismaClientRustPanicError',
			'PrismaClientInitializationError',
			'PrismaClientValidationError'
		].includes(err.constructor.name);
	}

	static devError (err: BackendError, req: Request, res: Response): Response {
		log.error(err);
		return error(req, res, 'GE_001', {
			status: err.code,
			data: {
				err: err,
				message: err.message,
				stack: err.stack
			}
		}).res;
	}

	static prodError (err: BackendError, req: Request, res: Response): Response {
		log.error(err);
		return error(req, res, 'GE_001', {
			status: err.code,
		}).res;
	}

	static mailError(err: MailError, req: Request, res: Response): Response {
		log.error(err);
		return error(req, res, 'GE_002', {
			status: err.code
		}).res;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static middleware (err: BackendError, req: Request, res: Response, _next: NextFunction): void {
		err.code = err.code || 500;
		if (process.env.NODE_ENV === 'production') 
			error500.prodError(err, req, res);
		else {
			if (error500.isPrismaError(err))
				error500.devError(error500.prisma(err as any), req, res);
			else if (err.constructor.name === 'MailError')
				error500.mailError(err, req, res);
			else if (error.name === 'JsonWebTokenError') 
				error500.devError(error500.jwt(), req, res);
			else if (error.name === 'TokenExpiredError') 
				error500.devError(error500.jwt(true), req, res);
			else
				error500.devError(err, req, res);
		}
	}
}
