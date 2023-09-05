import { get, RequestOptions } from 'https';

export default class fetch {
	static get(url: string, options?: RequestOptions): Promise<any> {
		return new Promise((resolve, reject) => {
			get(url, options ?? {}, (res) => {
				let data = '';
				res.on('data', (chunk) => data += chunk);
				res.on('end', () => resolve(data));
			})
				.on('error', (e) => reject(e));
		});
	}
}