import { STATUS_CODES } from 'http';

export default (code = 200): any => {
	return {
		info: 'Sybillin API',
		copyright: `Sybillin API 2023 - ${new Date().getFullYear()}`,
		code: code,
		status: STATUS_CODES[code]
	};
};
