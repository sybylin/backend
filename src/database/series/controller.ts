import { series } from 'database/db.instance';
import { Series } from '@prisma/client';
	
export default class controller {
	static async create(data: Series): Promise<Series | null | never> {
		if (!data || !data.title ||!data.description || !data.points)
			return null;
		return series.create({
			data: {
				title: data.title,
				image: data.image,
				description: data.description,
				points: data.points
			}
		});
	}
		
	static async findOne(idOrTitle: number | string): Promise<Series | null> {
		if (typeof(idOrTitle) === 'number') {
			return series.findUnique({
				where: {
					id: idOrTitle
				}
			});
		}
		return series.findUnique({
			where: {
				title: idOrTitle
			}
		});
	}
	
	static async findAll(): Promise<Series[] | null> {
		return series.findMany();
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
	
	static async delete(idOrTitle: number | string): Promise<Series> {
		if (typeof(idOrTitle) === 'number') {
			return series.delete({
				where: {
					id: idOrTitle
				}
			});
		}
		return series.delete({
			where: {
				title: idOrTitle
			}
		});
	}

	static async isExist(idOrTitle: number | string): Promise<boolean> {
		return ((await this.findOne(idOrTitle)) !== null);
	}
}