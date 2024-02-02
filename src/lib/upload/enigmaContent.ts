/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dirent, existsSync } from 'fs';
import { access, constants, mkdir, readdir, rm } from 'fs/promises';
import { join, resolve, normalize } from 'path/posix';
import multer from 'multer';
import { error, success } from 'code/format';
import Upload from './abstractUpload';
import { filenameGeneration, mimetypeIsAuthorized } from './lib';
import type { Request, Response, NextFunction } from 'express';
import type { Multer } from 'multer';

class UploadEnigmaContent extends Upload {
	public middleware: Multer;

	constructor() {
		super('enigmaContent', 5000000, ['image/jpeg', 'image/png', 'image/gif']);
		this.middleware = multer({
			storage: multer.diskStorage({
				destination: async (req, _file, cb) => {
					const path = resolve(this.path, req.user.id.toString());
					try {
						await access(path, constants.R_OK | constants.W_OK);
					} catch {
						await mkdir(path, { recursive: true });
					}
					cb(null, path);
				},
				filename: filenameGeneration
			}),
			limits: {
				fileSize: this.fileSize
			},
			fileFilter: (_req, file, cb) => cb(
				null,
				this.fileFilter.includes(file.mimetype.trim().toLowerCase())
			)
		});
	}

	check = async (req: Request, res: Response, _next: NextFunction): Promise<void | Response> => {
		if (!req.files)
			return error(req, res, 'RE_006').res;
		const filespath = (req.files as Express.Multer.File[]).map((f: Express.Multer.File) => resolve(this.path, req.user.id.toString(), f.filename));
		const genFilespath = (req.files as Express.Multer.File[]).map((f: Express.Multer.File) => join(this.publicPath, req.user.id.toString(), f.filename));
		for (const f of filespath) {
			if (!await mimetypeIsAuthorized(f, ['jpg', 'png', 'gif']))
				return error(req, res, 'RE_006').res;
		}
		return success(req, res, 'SE_103', { data: { paths: genFilespath } }).res;
	};

	listOfImage = async (req: Request, res: Response, _next: NextFunction): Promise<void | Response> => {
		const userPath = resolve(this.path, req.user.id.toString());
		let filesDirent: Dirent[] | null = null;
		if (existsSync(userPath)) {
			filesDirent = (await readdir(userPath, {
				encoding: 'utf-8',
				withFileTypes: true,
				recursive: false
			})).filter((e) => e.isFile());
		}

		return success(req, res, 'SE_103', {
			data: {
				files: (filesDirent)
					? filesDirent.map((e) => normalize(
						join(this.publicPath, req.user.id.toString(), e.name)
					))
					: []
			}
		}).res;
	};

	delete = async (req: Request, res: Response, _next: NextFunction): Promise<void | Response> => {
		if (!req.query.f)
			return error(req, res, 'RE_009', { data: { name: 'f' } }).res;
		try {
			const userPath = resolve(this.path, req.user.id.toString(), req.query.f as string);
			await rm(userPath);
			return success(req, res, 'SE_102').res;
		} catch {
			return error(req, res, 'EN_005').res;
		}
	};
}

export default UploadEnigmaContent;
