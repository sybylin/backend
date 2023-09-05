import { readFile } from 'fs/promises';
import { resolve } from 'path';
import nodemailer from 'nodemailer';
import { log } from 'lib/log';

const transport = nodemailer.createTransport(
	(process.env.DEV)
		? {
			host: 'localhost',
			port: 7895
		}
		: {
			host: process.env.BACKEND_MAIL_HOST,
			port: 465,
			secure: true,
			auth: {
				user: process.env.BACKEND_MAIL_USER,
				pass: process.env.BACKEND_MAIL_PASS
			}
		}
);
const fromDefault = 'Sibyllin <hello@sibyllin.app';

export class mail {
	private static formatString(str: string, args: Record<string, string>): string {
		const matchs = str.matchAll(/(?<main>{{[ \t]*(?<key>[\S]+)[ \t]*}})/gi);
		let x = 0, ret = '';

		for (const match of matchs) {
			if (!match.index || !match.groups || !match.groups.key)
				continue;
			const val = (match.groups.key !== 'date')
				? args[match.groups.key]
				: new Date().getFullYear();
			ret += str.substring(x, match.index);
			ret += val ?? match.groups.main;
			x = match.index + match.groups.main.length;
		}
		ret += str.substring(x).trim();
		return ret;
	}

	static sendVerify(to: string, pathToHtml: string, args: Record<string, string> | undefined = undefined): Promise<boolean | Error> {
		return new Promise((res, rej) => {
			readFile(resolve('.', 'mail', pathToHtml), { encoding: 'utf-8' })
				.then((data) => {
					transport.sendMail({
						from: 'Sibyllin <verify@sibyllin.app>',
						to,
						subject: 'Sibyllin account verification',
						html: this.formatString(data, args ?? {})
					}, (err, info) => {
						if (err)
							return rej(err);
						if (info.accepted && info.accepted.length) {
							log.info('Mail send with id', info.messageId);
							return res(true);
						}
						log.info('Mail rejected with id', info.messageId);
						return rej(new Error('Mail rejected'));
					});
				})
				.catch((e) => rej(e));
		});
	}

	static send(to: string, subject: string, from: string = fromDefault, text: string, html: string | undefined = undefined): Promise<boolean | Error> {
		return new Promise((resolve, reject) => {
			if (!text.length)
				return reject(false);
			transport.sendMail({
				from,
				to,
				subject,
				text,
				html
			}, (err, info) => {
				if (err)
					return reject(err);
				if (info.accepted && info.accepted.length) {
					log.info('Mail send with id', info.messageId);
					return resolve(true);
				}
				log.info('Mail rejected with id', info.messageId);
				return reject(new Error('Mail rejected'));
			});
		});
	}
}

export default mail;
