import { createHash, createHmac, randomInt, randomBytes } from 'node:crypto';

const ALTCHA_ALG = 'SHA-256';
const ALTCHA_ALG_NODE = ALTCHA_ALG.replace('-', ''); // Node.js doesn't like dashes
const ALTCHA_NUM_RANGE = [1e3, 1e5]; // [min, max] - adjust complexity here
const ALTCHA_HMAC_KEY = '$ecret.key'; // Change the secret HMAC key

const createALTCHA = (salt = randomBytes(12).toString('hex'), number = randomInt(...ALTCHA_NUM_RANGE)) => {
	const challenge = createHash(ALTCHA_ALG_NODE).update(salt + number).digest('hex');
	return {
		algorithm: ALTCHA_ALG,
		challenge,
		salt,
		signature: createHmac(ALTCHA_ALG_NODE, ALTCHA_HMAC_KEY).update(challenge).digest('hex'),
	};
};

const verifyALTCHA = (payload: string) => {
	let json;
	try {
		json = JSON.parse(atob(payload));
	} catch {
		// invalid payload
	}
	if (json) {
		const { algorithm, challenge, salt, signature, number } = json;
		const check = createALTCHA(salt, number);
		if (algorithm === check.algorithm && challenge === check.challenge && signature == check.signature) 
			return true;
    
	}
	return false;
};
