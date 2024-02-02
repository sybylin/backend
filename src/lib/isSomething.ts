export const isString = (input: unknown): boolean =>
	typeof input === 'string' &&
	Object.prototype.toString.call(input) === '[object String]';

export const isNumber = (input: unknown): boolean =>
	typeof input === 'number' && Number.isFinite(input);

export const isNumeric = (input: unknown): boolean =>
	/^-?[\d.]+(?:e-?\d+)?$/.test(input as any);
