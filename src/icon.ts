import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Request, Response } from 'express';

const __favicon__ = Buffer.from(readFileSync(resolve('.', 'src', 'favicon.ico'), { encoding: 'base64' }), 'base64');

export default (_req: Request, res: Response): void => {
	res.status(200);
	res.setHeader('Content-Length', __favicon__.length);
	res.setHeader('Content-Type', 'image/x-icon');
	res.setHeader('Cache-Control', 'public, max-age=2592000');
	res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
	res.send(__favicon__);
};
