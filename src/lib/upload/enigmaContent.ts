import { Dirent, existsSync } from 'fs';
import { access, constants, mkdir, readdir } from 'fs/promises';
import { join, resolve, normalize } from 'path/posix';
import multer from 'multer';
import { error, success } from 'code/format';
import Upload from './abstractUpload';
import { enigmaModificationIsAuthorized, filenameGeneration, mimetypeIsAuthorized } from './lib';
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	check = async (req: Request, res: Response, _next: NextFunction): Promise<void | Response> => {
		const filepath = resolve(this.path, req.user.id.toString(), (req.file as Express.Multer.File).filename);
		const genFilePath = join(this.publicPath, req.user.id.toString(), (req.file as Express.Multer.File).filename);

		enigmaModificationIsAuthorized(req, res, false);
		if (!await mimetypeIsAuthorized(filepath, ['jpg', 'png', 'gif']))
			return error(req, res, 'RE_006').res;
		return success(req, res, 'SE_103', { data: { path: genFilePath } }).res;
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	listOfImage = async (req: Request, res: Response, _next: NextFunction): Promise<void | Response> => {
		let filesDirent: Dirent[] | null = null;
		if (existsSync(resolve(this.path, req.user.id.toString()))) {
			filesDirent = (await readdir(resolve(this.path, req.user.id.toString()), {
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
}

export default UploadEnigmaContent;
