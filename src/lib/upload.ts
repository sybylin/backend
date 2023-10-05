/* eslint-disable @typescript-eslint/no-unused-vars */
import { randomBytes } from 'crypto';
import {existsSync, mkdirSync } from 'fs';
import { rm, open } from 'fs/promises';
import { extname, join, resolve } from 'path/posix';
import multer from 'multer';
import filetype from 'file-type';
import isNumeric from 'validator/lib/isNumeric';
import { error, success } from '@/code/format';
import UserController from 'database/user/controller';
import SerieController from 'database/serie/controller';

import type { Request, Response, NextFunction } from 'express';
import type core from 'file-type/core';

interface uploadMiddleware {
	middleware: multer.Multer;
	check: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;
}

/**
 * Create public dir
 */
const uploadPath: Record<string, string> = {
	source: resolve('.', 'public'),
	user: resolve('.', 'public', 'user'),
	serie: resolve('.', 'public', 'serie')
};

for (const el in uploadPath) {
	if (!existsSync(uploadPath[el]))
		mkdirSync(uploadPath[el], { recursive: true });
}

const filenameGeneration = (
	_req: Request,
	file: Express.Multer.File,
	cb: (error: Error | null, destination: string) => void
) => {
	const firstPart = randomBytes(32).toString('hex').slice(0, 32);
	const getExtension = () => {
		const extOriginName = extname(file.originalname);
		return (!extOriginName || extOriginName.localeCompare('.') === 0)
			? ''
			: extOriginName;
	};
	cb(null, `${firstPart}${getExtension()}`);
};

const serieModificationIsAuthorized = async (req: Request, res: Response, checkSerieId = false) => {
	if (checkSerieId) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.serie_id || typeof req.body.serie_id === 'string' && !isNumeric(req.body.serie_id))
			return error(req, res, 'RE_002', { data: { key: 'serie_id' } }).res;
		if (!await SerieController.thisSerieIsCreatedByUser(Number(req.body.serie_id), req.user.id))
			return error(req, res, 'SE_003').res;
	}
	if (!Object.keys(req.file as any).length && !req.files?.length)
		return error(req, res, 'RE_004').res;
};

const mimetypeIsAuthorized = async (filePath: string, filter: string[]): Promise<boolean> =>
	new Promise((reso, reje) => {
		const buffer = Buffer.alloc(100);
		open(filePath, 'r')
			.then(async (fileHandle) => {
				await fileHandle.read(buffer, 0, 100, 0);
				const fileType = await filetype.fromBuffer(buffer);
				if (!filetype) {
					rm(filePath, { force: true });
					reje('RE_006');
				} else
					reso(filter.includes((fileType as core.FileTypeResult).ext));
				fileHandle.close();
			})
			.catch(async () => {
				rm(filePath, { force: true });
				reje();
			});
	});

/**
 * Middlewares for handle image serie logo (jpeg & png)
 * Max size: 5 mb
 */
export const uploadSerieLogo = {
	middleware: multer({
		storage: multer.diskStorage({
			destination: (_req, _file, cb) => cb(null, uploadPath.serie),
			filename: filenameGeneration
		}),
		limits: {
			fileSize: 5000000 /// 5mb
		},
		fileFilter: (_req, file, cb) => cb(
			null,
			['image/jpeg', 'image/png'].includes(file.mimetype.trim().toLowerCase())
		)
	}),
	check: async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
		const filepath = resolve(uploadPath.serie, (req.file as Express.Multer.File).filename);
		const genFilePath = join('/', 'public', 'serie', (req.file as Express.Multer.File).filename);

		serieModificationIsAuthorized(req, res, true);
		if (!await mimetypeIsAuthorized(filepath, ['jpg', 'png']))
			error(req, res, 'RE_006');
		const oldName = await SerieController.updatePart(Number(req.body.serie_id), 'image', genFilePath) as Record<'image', string>;
		if (!oldName)
			return error(req, res, 'GE_001').res;
		rm(resolve('.', (oldName.image.charAt(0) === '/')
			? oldName.image.slice(1)
			: oldName.image), { force: true });
		return success(req, res, 'SE_103', { data: { path: genFilePath } }).res;
	}
} as uploadMiddleware;

/**
 * Middlewares for handle image serie logo (jpeg & png)
 * Max size: 5 mb
 */
export const uploadUserImage = {
	middleware: multer({
		storage: multer.diskStorage({
			destination: (_req, _file, cb) => cb(null, uploadPath.user),
			filename: filenameGeneration
		}),
		limits: {
			fileSize: 5000000 /// 5mb
		},
		fileFilter: (_req, file, cb) => cb(
			null,
			['image/jpeg', 'image/png'].includes(file.mimetype.trim().toLowerCase())
		)
	}),
	check: async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
		const filepath = resolve(uploadPath.user, (req.file as Express.Multer.File).filename);
		const genFilePath = join('/', 'public', 'user', (req.file as Express.Multer.File).filename);
		serieModificationIsAuthorized(req, res);

		if (!await mimetypeIsAuthorized(filepath, ['jpg', 'png']))
			error(req, res, 'RE_006');
		const oldName = await UserController.updateAvatar(req.user.id, genFilePath);
		if (!oldName || !oldName.avatar)
			return error(req, res, 'GE_001').res;
		rm(resolve('.', (oldName.avatar.charAt(0) === '/')
			? oldName.avatar.slice(1)
			: oldName.avatar), { force: true });
		return success(req, res, 'SE_103', { data: { path: genFilePath } }).res;
	}
} as uploadMiddleware;