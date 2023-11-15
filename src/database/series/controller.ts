import { series, enigma, userSeriesRating } from 'database/db.instance';
import { Series, SeriesStatus } from '@prisma/client';

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

interface getSeries {
	id: number;
	title: string;
	image: string | null;
	rating: number;
	modification_date: Date | null;
	creator: { name: string; avatar: string | null } | null;
	series_finished: Date | null;
	series_started: Date | null;
}

const cleanSeries = (e: any) => {
	return {
		id: e.id,
		title: e.title,
		image: e.image,
		rating: (e.user_series_rating && e.user_series_rating.length)
			? (e.user_series_rating.reduce((prev: any, curr: any) => prev + curr.rating, 0) / e.user_series_rating.length)
			: 2.5,
		modification_date: e.modification_date,
		series_finished: (e.series_finished && e.series_finished.length)
			? e.series_finished[0].completion_date
			: null,
		series_started: (e.series_started && e.series_started.length)
			? e.series_started[0].started_date
			: null,
		creator: (e.series_creator && e.series_creator.length)
			? e.series_creator[0].user
			: null
	};
};

export default class controller {
	static async create(data: Omit<Series, 'id' | 'image' | 'points' | 'published' | 'creation_date' | 'modification_date'>): Promise<Series | null | never> {
		if (!data || !data.title ||!data.description)
			return null;
		return series.create({
			data: {
				title: data.title,
				image: null,
				description: data.description,
				published: SeriesStatus.UNPUBLISHED
			}
		});
	}
		
	static async findOne(series_id: number, user_id: number): Promise<seriesOne | false | null> {
		const __series = await series.findUnique({
			where: {
				id: series_id,
			},
			select: {
				id: true,
				title: true,
				description: true,
				image: true,
				published: true,
				modification_date: true,
				series_creator: {
					select: {
						user_id: true,
						user: {
							select: {
								name: true,
								avatar: true
							}
						}
					}
				},
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
				},
				series_verified_by: {
					select: {
						rejectionReason: true
					}
				}
			}
		});
		if (!__series)
			return null;
		let isCreator = false;
		if (__series.series_creator.findIndex((s) => s.user_id === user_id) !== -1)
			isCreator = true;
		(__series as Record<string, any>).series_creator = __series.series_creator[0].user;
		return (isCreator || __series.published)
			? __series
			: false;
	}

	static async findAll(): Promise<Series[] | null> {
		return series.findMany();
	}

	static async findAllPublished(user_id: number): Promise<getSeries[] | null> {
		return (await series.findMany({
			where: {
				published: SeriesStatus.PUBLISHED,
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
		})).map(cleanSeries);
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
				description: data.description
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

	static async findLinkedToUser(user_id: number): Promise<getSeries[]> {
		return (await series.findMany({
			where: {
				published: SeriesStatus.PUBLISHED,
				series_started: {
					some: {
						user_id
					}
				},
				series_finished: {
					some: {
						user_id
					}
				}
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
		})).map(cleanSeries);
	}

	static async updatePart(series_id: number, part: 'title' | 'description' | 'image' | 'published', data: string | number | boolean): Promise<unknown> {
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

	static async findPending(user_id: number): Promise<getSeries[] | null> {
		return (await series.findMany({
			where: {
				published: SeriesStatus.PENDING,
				series_verified_by: {
					user_id
				}
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
				}
			},
			orderBy: [
				{
					modification_date: 'desc'
				}
			]
		})).map(cleanSeries);
	}

	static async userRight(series_id: number, user_id: number): Promise<boolean> {
		const _series_ = await series.findUnique({
			where: {
				id: series_id
			},
			select: {
				published: true,
				series_creator: {
					select: {
						user_id: true
					}
				},
				series_verified_by: {
					select: {
						user_id: true,
						verified: true
					}
				}
			}
		});
		if (!_series_)
			return false;
		return (
			(_series_.series_creator.length && _series_.series_creator.findIndex((e) => e.user_id === user_id) !== -1) ||
			(_series_.published === 'PUBLISHED' && _series_.series_verified_by?.verified) ||
			(_series_.published === 'PENDING' && _series_.series_verified_by?.user_id === user_id)
		);
	}
}