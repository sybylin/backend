import { join, resolve } from 'path';
import multer from 'multer';
import { error, success } from 'code/format';
import SeriesController from 'database/series/controller';
import Upload from './abstractUpload';
import { filenameGeneration, mimetypeIsAuthorized, removeOldImage, serieModificationIsAuthorized } from './lib';
import type { Request, Response, NextFunction } from 'express';
import type { Multer } from 'multer';

class UploadSeriesLogo extends Upload {
	public middleware: Multer;

	constructor() {
		super('series', 5000000, ['image/jpeg', 'image/png']);
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
		if (!req.file)
			return error(req, res, 'RE_006').res;

		const filepath = resolve(this.path, (req.file as Express.Multer.File).filename);
		const genFilePath = join(this.publicPath, (req.file as Express.Multer.File).filename);

		await serieModificationIsAuthorized(req, res, true);
		if (!await mimetypeIsAuthorized(filepath, ['jpg', 'png']))
			return error(req, res, 'RE_006').res;
		const oldName = await SeriesController.updatePart(Number(req.body.series_id), 'image', genFilePath) as Record<'image', string>;
		if (oldName && oldName.image)
			removeOldImage(oldName.image);
		return success(req, res, 'SE_103', { data: { path: genFilePath } }).res;
	};
}

export default UploadSeriesLogo;
