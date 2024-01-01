// import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';

export default {
	external: [
		'crypto', 'http', 'https', 'fs', 'fs/promises', 'path', 'path/posix',
		'brotli-wasm', 'compression', 'cookie-parser', 'cors', 'cron', 'dompurify',
		'express', 'helmet', 'hpp', 'jsdom', 'jsonwebtoken', 'lodash', 'lz-string',
		'nodemailer', 'argon2', 'util', 'express-rate-limit', '@prisma/client',
		'validator/lib/isEmail', 'validator/lib/normalizeEmail',
		'validator/lib/isEmpty', 'validator/lib/isNumeric',
		'validator/lib/escape', 'validator/lib/ltrim', 'validator/lib/rtrim',
		'file-type', 'multer'
	],
	input: 'src/index.ts',
	output: [
		{
			entryFileNames: '[name].[format].js',
			format: 'es',
			dir: 'dist'
		},
		{
			entryFileNames: '[name].[format].js',
			format: 'cjs',
			dir: 'dist'
		}
	],
	watch: {
		exclude: [ '.vscode/**', 'node_modules/**' ],
		include: [ 'prisma/**', 'src/**' ],
		buildDelay: 500,
		clearScreen: false
	},
	plugins: [
		typescript(),
		typescriptPaths(),
		// terser()
	]
};
