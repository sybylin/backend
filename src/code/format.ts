import { log } from 'lib/log';
import { sendCookieToResponse } from 'lib/jwt';
import { getInfo } from './index';
import type { Response, Request } from 'express';
import type { token } from 'lib/jwt';

interface formatOptions {
	data?: Record<string, any>;
	lang?: string; // [en_us, fr_fr]
	status?: number; // response HTTP code
}

function resFormat(
	isError: boolean,
	defaultCode: number,
	req: Request<any>,
	res: Response<any>,
	code: string,
	options: formatOptions | undefined,
	jwt?: token
) {
	const statusCode = options?.status ?? defaultCode;
	const info = getInfo(code, options?.lang?.toLowerCase() ?? String(req.body.lang).toLowerCase().replaceAll(/[_/\\]/g, '-'));
	const retObj: Record<string, unknown> = {
		statusCode,
		info,
		...options?.data
	};

	if (isError)
		log.error(`[${statusCode}]`, info.message);
	else
		log.info(`[${statusCode}]`, info.message);
	if (jwt) {
		sendCookieToResponse(res, jwt);
		retObj['x-xsrf-token'] = jwt.xsrf;
	}

	res.status(statusCode).send(retObj);
}

export function error(
	req: Request<any>,
	res: Response<any>,
	code: string,
	options: formatOptions | undefined = undefined
): void {
	resFormat(true, 400, req, res, code, options);
}

export function success(
	req: Request<any>,
	res: Response<any>,
	code: string,
	options: formatOptions | undefined = undefined,
	jwt?: token
): void {
	resFormat(false, 200, req, res, code, options, jwt);
}
