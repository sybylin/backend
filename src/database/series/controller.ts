import { series, enigma, userSeriesRating } from 'database/db.instance';
import { Series } from '@prisma/client';

interface seriesOne {
	id: number;
	image: string | null;
	modification_date: Date | null;
	title: string;
	description: string;
	series_enigma_order: {
		enigma: {
			id: number;
			image: string | null;
			title: string;
			description: string;
			enigma_finished: {
				completion_date: Date | null;
			}[];
		};
	}[];
}

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
		
	static async findOne(series_id: number, user_id: number): Promise<seriesOne | null> {
		return series.findUnique({
			where: {
				id: series_id,
				published: true
			},
			select: {
				id: true,
				title: true,
				description: true,
				image: true,
				modification_date: true,
				series_enigma_order: {
					select: {
						enigma: {
							select: {
								id: true,
								title: true,
								description: true,
								image: true,
								enigma_finished: {
									where: {
										user_id
									},
									select: {
										completion_date: true
									}
								}
							}
						}
					},
					orderBy: [
						{ order: 'asc' }
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
		rating: number;
		modification_date: Date | null;
		creator: { name: string; avatar: string | null } | null;
		series_finished: Date | null;
		series_started: Date | null;
	}[] | null> {
		return (await series.findMany({
			where: {
				published: true,
			},
			select: {
				id: true,
				image: true,
				title: true,
				modification_date: true,
				series_creator: {
					select: {
						user: {
							select: {
								name: true,
								avatar: true
							}
						}
					}
				},
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
				},
				user_series_rating: {
					select: {
						rating: true
					}
				}
			},
			orderBy: [
				{
					modification_date: 'desc'
				}
			]
		})).map((e) => ({
			id: e.id,
			title: e.title,
			image: e.image,
			rating: (e.user_series_rating.length)
				? (e.user_series_rating.reduce((prev, curr) => prev + curr.rating, 0) / e.user_series_rating.length)
				: 2.5,
			modification_date: e.modification_date,
			series_finished: (e.series_finished.length)
				? e.series_finished[0].completion_date
				: null,
			series_started: (e.series_finished.length)
				? e.series_started[0].started_date
				: null,
			creator: (e.series_creator.length)
				? e.series_creator[0].user
				: null
		}));
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

	static async isExist(series_id: number): Promise<boolean> {
		return ((await series.findUnique({
			where: {
				id: series_id
			},
			select: {
				id: true
			}
		})) !== null);
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

	static async userRating(user_id: number, series_id: number): Promise<{ rating: number } | null> {
		return userSeriesRating.findUnique({
			where: {
				user_id_series_id: {
					user_id,
					series_id
				}
			},
			select: {
				rating: true
			}
		});
	}

	static async rating(series_id: number): Promise<number | null> {
		const ret = await userSeriesRating.aggregate({
			where: {
				series_id
			},
			_count: {
				_all: true
			},
			_sum: {
				rating: true
			}
		});

		if (ret._count._all <= 0 || !ret._sum.rating)
			return null;
		return (ret._count._all === 1)
			? ret._sum.rating
			: ret._sum.rating / ret._count._all;
	}
}