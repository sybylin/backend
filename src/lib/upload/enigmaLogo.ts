import { join, resolve } from 'path';
import multer from 'multer';
import { error, success } from 'code/format';
import Enigma from 'database/enigma/controller';
import Upload from './abstractUpload';
import { enigmaModificationIsAuthorized, filenameGeneration, mimetypeIsAuthorized, removeOldImage } from './lib';
import type { Request, Response, NextFunction } from 'express';
import type { Multer } from 'multer';

class UploadEnigmaLogo extends Upload {
	public middleware: Multer;

	constructor() {
		super('enigma', 5000000, ['image/jpeg', 'image/png']);
		this.middleware = multer({
			storage: multer.diskStorage({
				destination: (_req, _file, cb) => cb(null, this.path),
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
		const filepath = resolve(this.path, (req.file as Express.Multer.File).filename);
		const genFilePath = join(this.publicPath, (req.file as Express.Multer.File).filename);

		enigmaModificationIsAuthorized(req, res, true);
		if (!await mimetypeIsAuthorized(filepath, ['jpg', 'png']))
			return error(req, res, 'RE_006').res;
		const oldName = await Enigma.updatePart(Number(req.body.enigma_id), 'image', genFilePath) as Record<'image', string>;
		if (oldName && oldName.image)
			removeOldImage(oldName.image);
		return success(req, res, 'SE_103', { data: { path: genFilePath } }).res;
	};
}

export default UploadEnigmaLogo;
