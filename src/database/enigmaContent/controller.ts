import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { enigmaContent, series } from 'database/db.instance';
import { EnigmaContent } from '@prisma/client';
import { brotliCompress } from '@/lib/brotli';
import SeriesStartedController from 'database/seriesStarted/controller';

export default class controller {
	static async create(data: EnigmaContent): Promise<EnigmaContent | null | never> {
		if (!data)
			return null;
		return enigmaContent.create({
			data: {
				enigma_id: data.enigma_id,
				development: data.development ?? null,
				production: data.production ?? null
			}
		});
	}

	static async read(id: number): Promise<EnigmaContent | null> {
		return await enigmaContent.findUnique({
			where: {
				enigma_id: id
			}
		});
	}

	static async readDevelopment(id: number): Promise<string | null> {
		const enigma = await enigmaContent.findUnique({
			where: {
				enigma_id: id
			},
			select: {
				development: true
			}
		});
		return enigma?.development ?? null;
	}

	static async readProduction(
		enigma_id: number,
		series_id: number,
		user_id: number,
		is_modo: boolean
	): Promise<string | false | null | { notExist?: true, empty?: true }> {
		const enigmasSeries = await series.findUnique({
			where: {
				id: series_id
			},
			select: {
				series_enigma_order: {
					select: {
						enigma: {
							select: {
								id: true,
								enigma_content: {
									where: {
										enigma_id
									},
									select: {
										production: true
									}
								},
								enigma_finished: {
									where: {
										user_id
									},
									select: {
										completion_date: true
									}
								}
							}
						},
						order: true
					},
					orderBy: [
						{ order: 'asc' }
					]
				}
			}
		});

		const enigmaIndex = enigmasSeries?.series_enigma_order.findIndex((e) => e.enigma.id === enigma_id);
		if (!enigmasSeries || enigmaIndex === undefined || enigmaIndex <= -1)
			return { notExist: true };
		if (!is_modo && enigmaIndex === 0)
			await SeriesStartedController.create({ series_id, user_id });
		if (
			is_modo ||
			enigmasSeries.series_enigma_order[enigmaIndex].order === 1 ||
			enigmasSeries.series_enigma_order[enigmaIndex - 1].enigma.enigma_finished.length > 0
		)
			return enigmasSeries.series_enigma_order[enigmaIndex].enigma.enigma_content?.production ?? { empty: true };
		return false;
	}

	static async findAll(): Promise<EnigmaContent[] | null> {
		return enigmaContent.findMany();
	}

	static async updatePart(id: number, data: string, devOrProd: 'dev' | 'prod'): Promise<EnigmaContent | null> {
		const cleanAndCompress = async () => {
			if (devOrProd === 'prod')
				return await brotliCompress(data);
			else
				return await brotliCompress(DOMPurify(new JSDOM('').window).sanitize(data));
		};
		const clean = await cleanAndCompress() ?? '';

		return enigmaContent.upsert({
			where: {
				enigma_id: id
			},
			create: {
				enigma_id: id,
				development: (devOrProd === 'dev')
					? clean
					: '',
				production: (devOrProd === 'prod')
					? clean
					: ''
			},
			update: {
				development: (devOrProd === 'dev')
					? clean
					: undefined,
				production: (devOrProd === 'prod')
					? clean
					: undefined
			}
		});
	}

	static async updateAll(data: EnigmaContent): Promise<EnigmaContent | null> {
		if (!data)
			return null;
		return enigmaContent.update({
			where: {
				enigma_id: data.enigma_id
			},
			data: {
				development: data.development,
				production: data.production
			}
		});
	}

	static async delete(id: number): Promise<EnigmaContent> {
		return enigmaContent.delete({
			where: {
				enigma_id: id
			}
		});
	}
}
