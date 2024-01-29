import { createHash, createHmac, randomInt, randomBytes, generateKey } from 'crypto';
import { CronJob } from 'cron';
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
	private usedChallenge: Map<string, number> = new Map();
	private cronJob: CronJob;
	private genSalt = () => {
		const expiration = new Date();
		expiration.setTime(expiration.getTime() + 300000); // 5 minutes
		return `${expiration.getTime()}.${randomBytes(12).toString('hex')}`;
	};

	constructor() {
		generateKeyObject
			.then((key) => {
				this.hmac = key;
			})
			.catch((e) => log.error(e));

		this.cronJob = new CronJob('*/5 * * * *', () => {
			const currentTimestamp = new Date().getTime();
			for (const it of this.usedChallenge.entries()) {
				if (it[1] < currentTimestamp)
					this.usedChallenge.delete(it[0]);
			}
		});
		this.cronJob.start();
	}

	/**
	 * Check if captcha have already been used
	 * @param payload string
	 */
	isUsedCaptcha(payload: string): boolean {
		return this.usedChallenge.has(
			createHash(this.convertAlgo).update(payload).digest('hex')
		);
	}

	/**
	 * Insert used captcha in list
	 */
	insertUsedCaptcha(payload: string, timestamp: number): void {
		this.usedChallenge.set(
			createHash(this.convertAlgo).update(payload).digest('hex'),
			timestamp
		);
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

		if (this.isUsedCaptcha(payload))
			return false;
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
			const currentDate = new Date().getTime();
			if (!payloadExpiration || Number(payloadExpiration[1]) < currentDate === true)
				return false;
			const check = await this.create(data.salt, data.number);
			if (
				check
				&& data.algorithm.localeCompare(check.algorithm) === 0
				&& data.challenge.localeCompare(check.challenge) === 0
				&& data.signature.localeCompare(check.signature) === 0
			) {
				this.insertUsedCaptcha(payload, Number(payloadExpiration));
				return true;
			}
		}
		return false;
	}
}

const CaptchaInstance = new Captcha();
export default CaptchaInstance;
