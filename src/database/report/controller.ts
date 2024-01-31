import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { report } from 'database/db.instance';
import { Report, ReportType } from '@prisma/client';

export default class controller {
	static async create(data: Omit<Report, 'id' | 'status' | 'creation_date' | 'modification_date'>): Promise<{ id: number } | null | never> {
		if (!data)
			return null;
		return report.create({
			data: {
				type: data.type,
				message: DOMPurify(new JSDOM('').window).sanitize(data.message)
			},
			select: {
				id: true
			}
		});
	}

	static async read(id: number): Promise<Report | null> {
		return report.findUnique({
			where: {
				id
			}
		});
	}

	static async findType(type: ReportType): Promise<Report | Report[] | null> {
		return report.findMany({
			where: {
				type
			},
			orderBy: [
				{ creation_date: 'desc' },
				{ modification_date: 'desc' }
			]
		});
	}

	static async findAll(): Promise<Report[] | null> {
		return report.findMany({
			orderBy: [
				{ creation_date: 'desc' },
				{ modification_date: 'desc' }
			]
		});
	}

	static async update(data: Omit<Report, 'creation_date' | 'modification_date'>): Promise<Report | null> {
		if (!data)
			return null;
		return report.update({
			where: {
				id: data.id
			},
			data: {
				type: data.type,
				message: DOMPurify(new JSDOM('').window).sanitize(data.message),
				status: data.status
			}
		});
	}

	static async delete(id: number): Promise<boolean> {
		return report.delete({
			where: {
				id: id
			},
			select: {
				id: true
			}
		}) !== null;
	}
}
