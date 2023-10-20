import { randomBytes } from 'crypto';
import { open, rm } from 'fs/promises';
import { extname, resolve } from 'path';
import filetype from 'file-type';
import isNumeric from 'validator/lib/isNumeric';
import { error } from 'code/format';
import EnigmaCreator from 'database/enigmaCreator/controller';
import SeriesController from 'database/series/controller';
import type { Request, Response } from 'express';
import type core from 'file-type/core';

export const enigmaModificationIsAuthorized = async (req: Request, res: Response, checkEnigmaId = false): Promise<Response | undefined> => {
	if (checkEnigmaId) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.enigma_id || typeof req.body.enigma_id === 'string' && !isNumeric(req.body.enigma_id))
			return error(req, res, 'RE_002', { data: { key: 'enigma_id' } }).res;
		if (!await EnigmaCreator.thisEnigmaIsCreatedByUser(Number(req.body.enigma_id), req.user.id))
			return error(req, res, 'SE_003').res;
	}
	if (!Object.keys(req.file as any).length && !req.files?.length)
		return error(req, res, 'RE_004').res;
};

export const serieModificationIsAuthorized = async (req: Request, res: Response, checkSerieId = false): Promise<Response | undefined> => {
	if (checkSerieId) {
		if (!Object.keys(req.body).length)
			return error(req, res, 'RE_001').res;
		if (!req.body.series_id || typeof req.body.series_id === 'string' && !isNumeric(req.body.series_id))
			return error(req, res, 'RE_002', { data: { key: 'series_id' } }).res;
		if (!await SeriesController.thisSeriesIsCreatedByUser(Number(req.body.series_id), req.user.id))
			return error(req, res, 'SE_003').res;
	}
	if (!Object.keys(req.file as any).length && !req.files?.length)
		return error(req, res, 'RE_004').res;
};

export const removeOldImage = (link?: string): void => {
	if (link && link.length) {
		rm(resolve('.', (link.charAt(0) === '/')
			? link.slice(1)
			: link), { force: true });
	}
};

export const mimetypeIsAuthorized = async (filePath: string, filter: string[]): Promise<boolean> =>
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

export const filenameGeneration = (
	_req: Request,
	file: Express.Multer.File,
	cb: (error: Error | null, destination: string) => void
): void => {
	const firstPart = randomBytes(32).toString('hex').slice(0, 32);
	const getExtension = () => {
		const extOriginName = extname(file.originalname);
		return (!extOriginName || extOriginName.localeCompare('.') === 0)
			? ''
			: extOriginName;
	};
	cb(null, `${firstPart}${getExtension()}`);
};
