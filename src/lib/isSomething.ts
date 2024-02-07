/**
 * Check if input is valid string
 */
export const isString = (input: unknown): boolean =>
	typeof input === 'string' &&
	Object.prototype.toString.call(input) === '[object String]';

/**
 * Check if input is number (accept Number)
 */
export const isNumber = (input: unknown): boolean =>
	typeof input === 'number' && Number.isFinite(input);

/**
 * Check if input is number (accept everything)
 */
export const isNumeric = (input: unknown): boolean =>
	/^-?[\d.]+(?:e-?\d+)?$/.test(input as any);
