import EventEmitter from 'events';
import { createWriteStream, unlink } from 'fs';
import http from 'http';
import https from 'https';
import { basename, resolve } from 'path';

export interface statFile {
	percent: number;
	received: number;
	size: number;
}

/**
	* Download file from web, accept http and https url
	* This function does not check the content of the downloaded file, it is up to you to perform the necessary checks so as not to compromise the user's security
*/
export default class extends EventEmitter {
	private _url: string;
	private _destination: string;
	stat: statFile;
	
	constructor(url: string, destination?: string) {
		super();
		this._url = url;
		this._destination = destination ?? resolve('.', basename(new URL(url).pathname));
		this.stat = {
			percent: 0,
			received: 0,
			size: 0
		};
	}

	get url(): string {
		return this._url;
	}

	set url(newUrl: string) {
		this._url = newUrl;
	}

	get destination(): string {
		return this._destination;
	}

	set destination(newDestination: string) {
		this._destination = newDestination;
	}

	get(): Promise<void> {
		return new Promise((resolve, reject) => {
			let httpMethod = (this.url.indexOf(('https://')) !== -1)
				? https
				: http;
			let request: http.ClientRequest;

			const file = createWriteStream(this.destination);

			const chunkListener = (data: any) => {
				this.stat.received += data.length;
				if (this.stat.size > 0) {
					this.stat.percent = Math.floor((this.stat.received / this.stat.size) * 100);
					if (this.stat.percent < 0)
						this.stat.percent = 0;
					if (this.stat.percent > 100)
						this.stat.percent = 100;
				}
				this.emit('data', this.stat);
			};

			const navigateThrowLocation = async (_url: string, _callback: () => void) => {
				request = httpMethod.get(_url, async (res) => {
					if (res.headers.location
						|| res.statusCode && (res.statusCode >= 300 && res.statusCode <= 399) && res.headers.location) {
						httpMethod = (_url.indexOf(('https://')) !== -1)
							? https
							: http;
						return await navigateThrowLocation(res.headers.location, _callback);
					}
					this.stat.size = Number(res.headers['content-length']);
					res.on('data', chunkListener);
					res.pipe(file);
					file.on('finish', () => {
						res.off('data', chunkListener);
						file.close((err) => {
							if (err)
								reject(err);
							resolve();
						});
					});
					return _callback();
				});
			};
	
			this.stat.percent = 0;
			this.stat.received = 0;
			this.stat.size = 0;
			return navigateThrowLocation(this.url, () => {
				request.on('error', (err) => {
					unlink(this.destination, (errFs) => {
						if (errFs)
							reject(errFs);
					});
					reject(err);
				});
				file.on('error', (err) => {
					unlink(this.destination, (errFs) => {
						if (errFs)
							reject(errFs);
					});
					reject(err);
				});
			});
		});
	}
}
