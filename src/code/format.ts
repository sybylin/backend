import { log } from 'lib/log';
import { sendCookieToResponse } from 'lib/jwt';
import { getInfo } from './index';
import type { Response, Request } from 'express';
import type { token } from 'lib/jwtInterface';

interface formatOptions {
	data?: Record<string, any>;
	lang?: string; // [en_us, fr_fr]
	status?: number; // response HTTP code
}

function getLang(req: Request<any>, options: formatOptions | undefined) {
	const parse = (str: string) => String(str).toLowerCase().replaceAll(/[_/\\]/g, '-');

	if (options && options.lang)
		return options.lang?.toLowerCase();
	if (req.body && req.body.lang)
		return parse(req.body.lang);
	if (req.params && req.params.lang)
		return parse(req.params.lang);
	return undefined;
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
	const info = getInfo(code, getLang(req, options));
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
): true {
	resFormat(true, 400, req, res, code, options);
	return true;
}

export function success(
	req: Request<any>,
	res: Response<any>,
	code: string,
	options: formatOptions | undefined = undefined,
	jwt?: token
): false {
	resFormat(false, 200, req, res, code, options, jwt);
	return false;
}
