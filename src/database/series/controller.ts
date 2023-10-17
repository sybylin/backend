import { series, enigma } from 'database/db.instance';
import { Series } from '@prisma/client';
	
export default class controller {
	static async create(data: Omit<Series, 'id' | 'image' | 'points' | 'published' | 'creation_date' | 'modification_date'>): Promise<Series | null | never> {
		if (!data || !data.title ||!data.description)
			return null;
		return series.create({
			data: {
				title: data.title,
				image: null,
				description: data.description,
				published: false,
				points: 0
			}
		});
	}
		
	static async findOne(idOrTitle: number | string): Promise<Series | null> {
		return series.findUnique({
			where: (typeof idOrTitle === 'number')
				? { id: idOrTitle }
				: { title: idOrTitle },
			include: {
				series_enigma_order: {
					include: {
						enigma: true
					},
					orderBy: [
						{
							order: 'asc'
						}
					]
				}
			}
		});
	}

	static async findAll(): Promise<Series[] | null> {
		return series.findMany();
	}

	static async findAllPublished(user_id: number): Promise<{
		id: number;
		title: string;
		image: string | null;
		modification_date: Date | null;
		series_finished: { completion_date: Date | null }[];
		series_started: { started_date: Date | null }[];
	}[] | null> {
		return series.findMany({
			where: {
				published: true,
			},
			select: {
				id: true,
				image: true,
				title: true,
				modification_date: true,
				series_started: {
					where: {
						user_id
					},
					select: {
						started_date: true
					}
				},
				series_finished: {
					where: {
						user_id
					},
					select: {
						completion_date: true
					}
				}
			},
			orderBy: [
				{
					modification_date: 'desc'
				}
			]
		});
	}
	
	static async update(data: Series): Promise<Series | null> {
		if (!data)
			return null;
		return series.update({
			where: {
				id: data.id
			},
			data: {
				title: data.title,
				image: data.image,
				description: data.description,
				points: data.points
			}
		});
	}
	
	static async delete(id: number): Promise<{ id: number }> {
		await enigma.deleteMany({
			where: {
				series_id: id
			}
		});
		return series.delete({
			where: {
				id
			},
			select: {
				id: true
			}
		});
	}

	static async isExist(idOrTitle: number | string): Promise<boolean> {
		return ((await this.findOne(idOrTitle)) !== null);
	}

	static async findCreatedByUser(user_id: number): Promise<Series[]> {
		return series.findMany({
			where: {
				series_creator: {
					some: {
						user_id
					}
				}
			},
			orderBy: [
				{
					title: 'asc'
				}
			]
		});
	}

	static async thisSeriesIsCreatedByUser(series_id: number, user_id: number): Promise<boolean> {
		return (await series.findUnique({
			where: {
				id: series_id,
				series_creator: {
					some: {
						user_id
					}
				}
			},
			select: {
				id: true
			}
		}) !== null
		);
	}

	static async updatePart(series_id: number, part: 'title' | 'description' | 'points' | 'image' | 'published', data: string | number | boolean): Promise<unknown> {
		const obj: Record<string, string | number | boolean> = {};
		const select: Record<string, boolean> = {};
		obj[part] = data;
		select[part] = true;
		const ret = await series.findUnique({
			where: {
				id: series_id
			},
			select
		});
		await series.update({
			where: {
				id: series_id
			},
			data: obj,
			select
		});
		return ret;
	}
}