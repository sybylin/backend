import { createHash, createHmac, randomInt, randomBytes, generateKey } from 'crypto';
import { log } from './log';
import type { KeyObject } from 'crypto';

interface captchaCreate {
	algorithm: string;
	challenge: string;
	salt: string;
	signature: string;
}

interface captchaVerify extends captchaCreate {
	number: number
}

const generateKeyObject: Promise<KeyObject> = new Promise((res, rej) => {
	generateKey('hmac', { length: 256 }, (err, key) => {
		if (err)
			return rej(err);
		res(key);
	});
});

class Captcha {
	private algo = 'SHA-256';
	private convertAlgo = this.algo.replace('-', '').toLowerCase();
	private minInt = 1e3;
	private maxInt = 1e5;
	private hmac: KeyObject | undefined = undefined;
	private genSalt = () => {
		const expiration = new Date();
		expiration.setTime(expiration.getTime() + 60000); // 1 minute
		return `${expiration.getTime()}.${randomBytes(12).toString('hex')}`;
	};

	constructor() {
		generateKeyObject
			.then((key) => {
				this.hmac = key;
			})
			.catch((e) => log.error(e));
	}

	/**
	 * Create Captcha
	 */
	async create(salt = this.genSalt(), number = randomInt(this.minInt, this.maxInt)): Promise<captchaCreate | undefined> {
		if (!this.hmac)
			return undefined;

		const challenge = createHash(this.convertAlgo)
			.update(`${salt}${number}`)
			.digest('hex');
		return {
			algorithm: this.algo,
			challenge,
			salt,
			signature: createHmac(this.convertAlgo, this.hmac)
				.update(challenge)
				.digest('hex'),
		};
	}

	/**
	 * Check if captcha payload is valid
	 * @returns true if valid, false if not, null is payload is invalid
	 */
	async verify(payload: string | null): Promise<boolean | null> {
		if (!payload)
			return null;
		let data: captchaVerify | undefined = undefined;
		try {
			data = JSON.parse(
				atob(payload)
			) as captchaVerify;
		} catch  {
			// invalid payload
			return null;
		}
		if (data) {
			const payloadExpiration = /^(\d+)./gm.exec(data.salt);
			if (!payloadExpiration || Number(payloadExpiration[1]) < new Date().getTime())
				return false;
			const check = await this.create(data.salt, data.number);
			if (
				check
				&& data.algorithm.localeCompare(check.algorithm) === 0
				&& data.challenge.localeCompare(check.challenge) === 0
				&& data.signature.localeCompare(check.signature) === 0
			)
				return true;
		}
		return false;
	}
}

const CaptchaInstance = new Captcha();
export default CaptchaInstance;
