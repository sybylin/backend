import * as brotli from 'brotli-wasm';
import lzString from 'lz-string';

export const stringCompress = (data: string): string => JSON.stringify(lzString.compress(data));

export const stringDecompress = (data: string): string => lzString.decompress(JSON.parse(data));

export const brotliCompress = async (data: string): Promise<string | null> => {
	return stringCompress(
		brotli.compress(
			new TextEncoder().encode(data)
		).toString()
	);
};

export const brotliDecompress = async (data: string): Promise<string | null> => {
	return new TextDecoder().decode(
		brotli.decompress(
			Uint8Array.from(
				stringDecompress(data)
					.split(',')
					.map((n) => Number(n))
			)
		)
	);
};
