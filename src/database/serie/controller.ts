import { serie } from 'database/db.instance';
import { Serie } from '@prisma/client';
	
export default class controller {
	static async create(data: Omit<Serie, 'id' | 'image' | 'points' | 'creation_date' | 'modification_date'>): Promise<Serie | null | never> {
		if (!data || !data.title ||!data.description)
			return null;
		return serie.create({
			data: {
				title: data.title,
				image: null,
				description: data.description,
				points: 0
			}
		});
	}
		
	static async findOne(idOrTitle: number | string): Promise<Serie | null> {
		return serie.findUnique({
			where: (typeof idOrTitle === 'number')
				? { id: idOrTitle }
				: { title: idOrTitle },
			include: {
				serie_enigma_order: {
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
	
	static async findAll(): Promise<Serie[] | null> {
		return serie.findMany();
	}
	
	static async update(data: Serie): Promise<Serie | null> {
		if (!data)
			return null;
		return serie.update({
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
	
	static async delete(idOrTitle: number | string): Promise<Serie> {
		if (typeof(idOrTitle) === 'number') {
			return serie.delete({
				where: {
					id: idOrTitle
				}
			});
		}
		return serie.delete({
			where: {
				title: idOrTitle
			}
		});
	}

	static async isExist(idOrTitle: number | string): Promise<boolean> {
		return ((await this.findOne(idOrTitle)) !== null);
	}

	static async findCreatedByUser(user_id: number): Promise<Serie[]> {
		return serie.findMany({
			where: {
				serie_creator: {
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

	static async thisSerieIsCreatedByUser(serie_id: number, user_id: number): Promise<boolean> {
		return (await serie.findUnique({
			where: {
				id: serie_id,
				serie_creator: {
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
}