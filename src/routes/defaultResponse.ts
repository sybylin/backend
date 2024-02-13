import { STATUS_CODES } from 'http';

export default (code = 200): any => {
	return {
		info: 'Sybylin API',
		copyright: `Sybylin API 2023 - ${new Date().getFullYear()}`,
		code: code,
		status: STATUS_CODES[code]
	};
};
