export const isString = (input: unknown): boolean =>
	typeof input === 'string' &&
	Object.prototype.toString.call(input) === '[object String]';
