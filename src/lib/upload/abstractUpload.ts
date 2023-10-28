import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path/posix';
import type { Request, Response, NextFunction } from 'express';
import type { Multer } from 'multer';

export default abstract class Upload {
	/**
	 * Name of directory
	 */
	public dirname: string;
	/**
	 * URL point to directory
	 */
	public publicPath: string;
	/**
	 * Path to directory
	 */
	public path: string;
	/**
	 * File size limit
	 */
	public fileSize: number;
	/**
	 * Mimetype authorized
	 */
	public fileFilter: string[];

	/**
	 * Middleware for handle form data
	 */
	public abstract middleware: Multer;

	constructor(path: string | string[], fileSize: number = 5000000, fileFilter: string[] = ['image/jpeg', 'image/png']) {
		this.dirname = (Array.isArray(path))
			? path.join('/')
			: path;
		this.publicPath = join('/', 'public', this.dirname);
		this.path = (Array.isArray(path))
			? resolve(...['.', 'public', ...path])
			: resolve('.', 'public', path);
		this.fileSize = fileSize;
		this.fileFilter = fileFilter;

		if (!existsSync(this.path))
			mkdirSync(this.path, { recursive: true });
	}

	/**
	 * Check if the file is what it says it is
	 */
	abstract check(req: Request, res: Response, next: NextFunction): Promise<void | Response>
}
