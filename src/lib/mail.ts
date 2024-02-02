import { readFile } from 'fs/promises';
import { resolve } from 'path';
import nodemailer from 'nodemailer';
import { log } from 'lib/log';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type MailReturn = Promise<boolean>;
type MailType = 'confirm' | 'password' | 'passwordUpdate' | 'verify';
export interface MailInfo {
	from?: string;
	to: string;
	subject: string;
}

export class MailError extends Error {
	public code = 500;

	constructor(message: string) {
		super(message);
	}
}

export class Mail {
	private mailTemplates: Map<MailType, string>;
	private nodeMailer: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
	private icon = (process.env.NODE_ENV === 'production')
		? 'https://sybyl.in/icons/favicon-128x128.png'
		: 'http://localhost:9100/icons/favicon-128x128.png';
	public defaultMail: string;

	constructor(defaultMail?: string) {
		const list = [
			{ name: 'confirm', file: 'confirm.html' },
			{ name: 'password', file: 'password.html' },
			{ name: 'passwordUpdate', file: 'passwordUpdate.html' },
			{ name: 'verify', file: 'verify.html' }
		] as { name: MailType, file: string }[];

		this.mailTemplates = new Map();
		this.nodeMailer = nodemailer.createTransport(
			(process.env.NODE_ENV === 'production')
				? {
					host: process.env.BACKEND_MAIL_HOST,
					port: process.env.BACKEND_MAIL_PORT,
					secure: true,
					auth: {
						user: process.env.BACKEND_MAIL_USERNAME,
						pass: process.env.BACKEND_MAIL_PASSWORD
					}
				} as any
				: {
					host: 'localhost',
					port: 7895
				}
		);
		this.defaultMail = defaultMail ?? 'Sybylin <verify@sybyl.in>';

		for (const el of list) {
			readFile(resolve('.', 'mail', 'dist', el.file), { encoding: 'utf-8' })
				.then((d) => this.mailTemplates.set(el.name, d));
		}
	}

	private formatString(str: string, args: Record<string, unknown>): string {
		const matchs = str.matchAll(/(?<main>{{[ \t]*(?<key>[\S]+)[ \t]*}})/gi);
		const currentYear = new Date().getFullYear(), originYear = 2023;
		let x = 0, ret = '';

		for (const match of matchs) {
			if (!match.index || !match.groups || !match.groups.key)
				continue;
			const val = (match.groups.key !== 'date')
				? args[match.groups.key]
				: (currentYear > originYear)
					? `${originYear} - ${currentYear}`
					: `${originYear}`;
			ret += str.substring(x, match.index);
			ret += val ?? match.groups.main;
			x = match.index + match.groups.main.length;
		}
		ret += str.substring(x).trim();
		return ret;
	}

	private send(mailData: string | undefined, mailInfo: MailInfo, args?: Record<string, unknown>): MailReturn {
		return new Promise((res, rej) => {
			if (!mailData)
				return rej(new MailError('Mail rejected'));
			this.nodeMailer.sendMail({
				from: mailInfo.from ?? this.defaultMail,
				to: mailInfo.to,
				subject: mailInfo.subject,
				html: this.formatString(mailData, Object.assign({ icon: this.icon }, args) ?? { icon: this.icon })
			}, (err, info) => {
				if (err)
					return rej(new MailError(err.message));
				if (info.accepted && info.accepted.length) {
					log.info('Mail send with id', info.messageId);
					return res(true);
				}
				log.info('Mail rejected with id', info.messageId);
				return rej(new MailError('Mail rejected'));
			});
		});
	}

	private getTemplate(type: MailType) {
		return this.mailTemplates.get(type);
	}

	connectionCode(to: string, args: Record<'token', string>): MailReturn {
		return this.send(this.getTemplate('confirm'), {
			from: 'Sybylin <verify@sybyl.in>',
			to,
			subject: 'Sybylin connection code'
		}, args);
	}

	resetPassword(to: string, args: Record<'url', string>): MailReturn {
		return this.send(this.getTemplate('password'), {
			from: 'Sybylin <verify@sybyl.in>',
			to,
			subject: 'Sybylin password reset'
		}, args);
	}

	passwordUpdate(to: string): MailReturn {
		return this.send(this.getTemplate('passwordUpdate'), {
			from: 'Sybylin <verify@sybyl.in>',
			to,
			subject: 'Sybylin password update'
		});
	}

	accountVerification(to: string, args: Record<'token', string>): MailReturn {
		return this.send(this.getTemplate('verify'), {
			from: 'Sybylin <verify@sybyl.in>',
			to,
			subject: 'Sybylin account verification'
		}, args);
	}
}

const mailInstance = new Mail();

export default mailInstance;
