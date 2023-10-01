import { randomBytes } from 'crypto';
import { open, read, existsSync, mkdirSync } from 'fs';
import { rm } from 'fs/promises';
import { extname, resolve } from 'path/posix';
import multer from 'multer';
import { filetypename } from 'magic-bytes.js';
import { log } from './log';

import type { Request, Response, NextFunction } from 'express';
import { success } from '@/code/format';

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

/**
 * Middlewares for handle image upload (jpeg & png)
 * Max size: 5 mb
 */
export const uploadSerieLogo = {
	middleware: multer({
		storage: multer.diskStorage({
			destination: (_req, _file, cb) => cb(null, uploadPath.serie),
			filename: (_req, file, cb) => {
				const firstPart = randomBytes(32).toString('hex').slice(0, 32);
				const getExtension = () => {
					const extOriginName = extname(file.originalname);
					return (!extOriginName || extOriginName.localeCompare('.') === 0)
						? ''
						: extOriginName;
				};
				cb(null, `${firstPart}${getExtension()}`);
			}
		}),
		limits: {
			fileSize: 5000000 /// 5mb
		},
		fileFilter: (_req, file, cb) => cb(
			null,
			['image/jpeg', 'image/png'].includes(file.mimetype.trim().toLowerCase())
		)
	}),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	checkMimetype: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (!Object.keys(req.file as any).length && !req.files?.length)
			next('No file or files in request');
		try {
			const buffer = Buffer.alloc(100);
			const filepath = resolve(uploadPath.serie, (req.file as Express.Multer.File).filename);
			const sendErr = (err: NodeJS.ErrnoException | null) => {
				if (err) {
					log.error(err.message);
					throw new Error(err.message);
				}
			};

			open(filepath, 'r', (err, fd) => {
				sendErr(err);
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				read(fd, buffer, 0, 100, 0, (err, _num) => {
					sendErr(err);
					const info = filetypename(buffer);
					if (!info || (!info.includes('jpg') && !info.includes('png'))) {
						rm(filepath, { force: true });
						return next('Filetype forbidden');
					}
					return success(req, res, 'SE_103');
				});
			});
		} catch (e) {
			log.error(e);
			next();
		}
	}
};
