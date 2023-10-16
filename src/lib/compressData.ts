import { brotliCompress, brotliDecompress } from 'zlib';

export default {
	compress: (data: string): Promise<string> => new Promise((resolve, reject) => {
		brotliCompress(data, (err, result) => {
			if (err)
				return reject(err);
			resolve(result.toString());
		});
	}),
	decompress: (data: string): Promise<string> => new Promise((resolve, reject) => {
		brotliDecompress(Buffer.from(data), (err, result) => {
			if (err)
				return reject(err);
			resolve(result.toString());
		});
	})
};
