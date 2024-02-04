import { extname, resolve } from 'path/posix';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { ExpressLog } from 'lib/log';
import initAchievementMiddleware from './achievement/initMiddleware';
import routes from './routes';

import type { Application, NextFunction, Request, Response } from 'express';

(async() => {
	const app: Application = express();
	const PORT = process.env.BACK_PORT || process.env.PORT || 3000;

	app.disable('x-powered-by');
	app.set('trust proxy', 1);
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());
	app.use(cookieParser());
	app.use(helmet());
	app.use(hpp());

	app.use('/public', (_req, res, next) => {
		res.set('Cross-Origin-Resource-Policy', 'cross-origin');
		next();
	});
	app.use('/public', express.static(resolve('.', 'public')));

	app.use((_req: Request, res: Response, next: NextFunction): void => {
		res.setHeader('Vary', 'Origin');
		next();
	});

	app.use(cors({
		allowedHeaders: [
			'Content-Type', 'Access-Control-Allow-Headers', 'X-Requested-With',
			'Authorization', 'X-Xsrf-Token'
		],
		credentials: true,
		methods: ['DELETE', 'HEAD', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
		origin: [
			'https://sybyl.in', 'https://api.sybyl.in',
			'http://localhost:3000', 'http://localhost:9100'
		]
	}));

	app.use(compression());

	app.use(ExpressLog);

	app.use((req, res, next) => {
		const ext = extname(req.path);
		if (/.(appcache|atom|bbaw|bmp|crx|css|cur|eot|f4[abpv]|flv|geojson|gif|htc|ic[os]|jpe?g|m?js|json(ld)?|m4[av]|manifest|map|markdown|md|mp4|oex|og[agv]|opus|otf|pdf|png|rdf|rss|safariextz|svgz?|swf|topojson|tt[cf]|txt|vcard|vcf|vtt|webapp|web[mp]|webmanifest|woff2?|xloc|xpi)$/.test(ext)) {
			res.removeHeader('X-UA-Compatible');
			res.removeHeader('X-XSS-Protection');
		}
		if (/.(appcache|atom|bbaw|bmp|crx|css|cur|eot|f4[abpv]|flv|geojson|gif|htc|ic[os]|jpe?g|json(ld)?|m4[av]|manifest|map|markdown|md|mp4|oex|og[agv]|opus|otf|png|rdf|rss|safariextz|swf|topojson|tt[cf]|txt|vcard|vcf|vtt|webapp|web[mp]|webmanifest|woff2?|xloc|xpi)$/.test(ext)) {
			res.removeHeader('Content-Security-Policy');
			res.removeHeader('X-Content-Security-Policy');
			res.removeHeader('X-WebKit-CSP');
		}
		next();
	});

	app.use(initAchievementMiddleware);

	routes(app);

	app.listen(PORT, (): void => console.log(`server is running at ${PORT}`));
})();
