// import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';

export default {
	external: [
		'crypto', 'http', 'https', 'fs', 'fs/promises', 'path', 'path/posix',
		'compression', 'cookie-parser', 'cors', 'cron', 'express', 'helmet',
		'hpp', 'jsonwebtoken', 'lodash', 'nodemailer', 'argon2',
		'util', 'express-rate-limit', '@prisma/client',
		'validator/lib/isEmail', 'validator/lib/normalizeEmail',
		'validator/lib/isEmpty', 'validator/lib/isNumeric',
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
