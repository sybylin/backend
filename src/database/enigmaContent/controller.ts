import { enigmaContent } from 'database/db.instance';
import { EnigmaContent } from '@prisma/client';
// import compressData from 'lib/compressData';

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

	static async readProduction(id: number): Promise<string | null> {
		const enigma = await enigmaContent.findUnique({
			where: {
				enigma_id: id
			},
			select: {
				production: true
			}
		});
		return enigma?.production ?? null;
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
