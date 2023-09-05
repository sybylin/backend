import { readFile } from 'fs/promises';
import { resolve } from 'path';
import nodemailer from 'nodemailer';
import { log } from 'lib/log';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type MailReturn = Promise<boolean | Error>;
export interface MailInfo {
	from?: string;
	to: string;
	subject: string;
}

export class Mail {
	private confirmMail: string;
	private passwordMail: string;
	private verifyMail: string;
	private nodeMailer: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
	public defaultMail: string;

	constructor(defaultMail?: string) {
		this.confirmMail = '';
		this.passwordMail = '';
		this.verifyMail = '';
		this.nodeMailer = nodemailer.createTransport(
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
		this.defaultMail = defaultMail ?? 'Sibyllin <hello@sibyllin.app';

		readFile(resolve('.', 'mail', 'dist', 'confirm.html'), { encoding: 'utf-8' })
			.then((d) => this.confirmMail = d);
		readFile(resolve('.', 'mail', 'dist', 'password.html'), { encoding: 'utf-8' })
			.then((d) => this.passwordMail = d);
		readFile(resolve('.', 'mail', 'dist', 'verify.html'), { encoding: 'utf-8' })
			.then((d) => this.verifyMail = d);
	}

	private formatString(str: string, args: Record<string, unknown>): string {
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

	private send(mailData: string, mailInfo: MailInfo, args?: Record<string, unknown>): MailReturn {
		return new Promise((res, rej) => {
			this.nodeMailer.sendMail({
				from: mailInfo.from ?? this.defaultMail,
				to: mailInfo.to,
				subject: mailInfo.subject,
				html: this.formatString(mailData, args ?? {})
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
		});
	}

	connectionCode(to: string, args: Record<'token', string>): MailReturn {
		return this.send(this.confirmMail, {
			from: 'Sibyllin <verify@sibyllin.app>',
			to,
			subject: 'Sibyllin connection code'
		}, args);
	}

	resetPassword(to: string, args: Record<'url', string>): MailReturn {
		return this.send(this.passwordMail, {
			from: 'Sibyllin <verify@sibyllin.app>',
			to,
			subject: 'Sibyllin password reset'
		}, args);
	}

	accountVerification(to: string, args: Record<'token', string>): MailReturn {
		return this.send(this.verifyMail, {
			from: 'Sibyllin <verify@sibyllin.app>',
			to,
			subject: 'Sibyllin account verification'
		}, args);
	}
}

const mailInstance = new Mail();

export default mailInstance;
