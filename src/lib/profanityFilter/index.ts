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

export default (searchString: string): info | null => {
	let isFind: string | null = null;

	for (const lang of langList) {
		isFind = lang.list.find((e) => e.localeCompare(searchString) === 0) ?? null;

		if (isFind !== null) {
			return {
				lang: lang.lang,
				occurence: isFind
			};
		}
	}
	return null;
};
