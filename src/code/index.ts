import en_us from './en_US';
import fr_fr from './fr_FR';

export enum codeType { ERROR = 'error', SUCCESS = 'success', WARN = 'warning', INFO = 'info' }
export interface codeInfo {
	type: codeType;
	code: string;
	message: string;
}

export const errorList: { lang: string; data: { [key: string]: Record<string, string> } }[] = [
	{ lang: 'en-us', data: en_us },
	{ lang: 'fr-fr', data: fr_fr }
];

export const getList = (lang: string = 'en_us'): { [key: string]: Record<string, string> } => {
	for (const el of errorList) {
		if (el.lang.toLowerCase() === lang.toLowerCase())
			return el.data;
	}
	return errorList[0].data; // en_us
};

export const getInfo = (code: string, lang: string = 'en_us'): codeInfo => {
	if (code.length >= 6) {
		code = code.toUpperCase();
		const codeList = getList(lang);
		const exp = code.slice(0, code.indexOf('_')).toUpperCase();
		for (const x in codeList) {
			if (x.slice(0, exp.length).toUpperCase() === exp) {
				for (const y in codeList[x]) {
					if (y.toUpperCase() === code) {
						return {
							type: (y.charAt(y.indexOf('_') + 1) === '0')
								? codeType.ERROR
								: codeType.SUCCESS,
							code: y,
							message: codeList[x][y]
						};
					}
				}
				break;
			}
		}
	}
	return { type: codeType.ERROR, code: 'ERROR', message: `Code ${code} doesn't exist` };
};

export default getInfo;
