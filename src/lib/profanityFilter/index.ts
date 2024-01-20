import en from './lang/en';
import es from './lang/es';
import fr from './lang/fr';

const langList: { lang: profanityFilterLanguage, list: string[] }[] = [
	{ lang: 'English', list: en },
	{ lang: 'Spanish', list: es },
	{ lang: 'French', list: fr }
];

export type profanityFilterLanguage = 'English' | 'Spanish' | 'French';
export interface info {
	lang: profanityFilterLanguage,
	occurence: string
}

export default (searchString: string, exactMatch = true): info | null => {
	let isFind: string | null = null;

	for (const lang of langList) {
		isFind = (exactMatch)
			? lang.list.find((e: string) => e.toLowerCase().localeCompare(searchString.toLowerCase()) === 0) ?? null
			: lang.list.find((e: string) => e.toLowerCase().includes(searchString.toLowerCase()) === true) ?? null;
		if (isFind !== null) {
			return {
				lang: lang.lang,
				occurence: isFind
			};
		}
	}

	return null;
};
