import { enigmaContent, series } from 'database/db.instance';
import { EnigmaContent } from '@prisma/client';

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

	static async readProduction(enigma_id: number, series_id: number, user_id: number): Promise<string | false | null> {
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
			return null;
		if (
			enigmaIndex !== -1 &&
			(
				enigmasSeries.series_enigma_order[enigmaIndex].order === 1 ||
				enigmasSeries.series_enigma_order[enigmaIndex - 1].enigma.enigma_finished.length > 0
			)
		)
			return enigmasSeries.series_enigma_order[enigmaIndex].enigma.enigma_content?.production ?? '';
		return false;
	}

	static async findAll(): Promise<EnigmaContent[] | null> {
		return enigmaContent.findMany();
	}

	static async updatePart(id: number, data: string, devOrProd: 'dev' | 'prod'): Promise<EnigmaContent | null> {
		return enigmaContent.upsert({
			where: {
				enigma_id: id
			},
			create: {
				enigma_id: id,
				development: (devOrProd === 'dev')
					? data
					: '',
				production: (devOrProd === 'prod')
					? data
					: ''
			},
			update: {
				development: (devOrProd === 'dev')
					? data
					: undefined,
				production: (devOrProd === 'prod')
					? data
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
