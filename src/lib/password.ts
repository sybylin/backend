import { randomBytes, scrypt, timingSafeEqual } from 'crypto';

const scryptPromise = async (password: string, salt: string): Promise<Buffer> => {
	return new Promise((res, rej) => {
		scrypt(password, salt, 64, (err, derivedKey) => {
			if (err)
				return rej(err);
			return res(derivedKey);
		});
	});
};

export const hash = async (password: string): Promise<string> => {
	const salt = randomBytes(16).toString('hex');
	const buf = (await scryptPromise(password, salt));
	return `${buf.toString('hex')}.${salt}`;
};

export const verify = async (stored: string, supplied: string): Promise<boolean> => {
	const [ hashPassword, salt ] = stored.split('.');
	const hashPasswordBuf = Buffer.from(hashPassword, 'hex');
	const suppliedPasswordBuf = (await scryptPromise(supplied, salt));

	return timingSafeEqual(hashPasswordBuf, suppliedPasswordBuf);
};

/*
import * as argon2 from 'argon2';

const hash = async (password: string): Promise<string> => {
	return argon2.hash(password, { type: 2 });
};

const verify = async (hash: string, checkPassword: string): Promise<boolean> => {
	return argon2.verify(hash, checkPassword, { type: 2 });
};

export {
	hash,
	verify
};
*/
