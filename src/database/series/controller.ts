import prisma, { series, enigma, userSeriesRating } from 'database/db.instance';
import { Series, SeriesStatus } from '@prisma/client';

interface seriesOneEnigma {
	id: number;
	image: string | null;
	title: string;
	description: string;
	finished: 'START' | 'RESUME' | 'UNAUTHORIZED';
	enigma_finished: {
		completion_date: Date | null;
	}[];
}

interface seriesOne {
	id: number;
	title: string;
	description: string;
	image: string | null;
	rating: number;
	published: SeriesStatus;
	creation_date: Date | null;
	series_enigma_order: seriesOneEnigma[];
	series_creator: {
		id: number;
		name: string
		avatar: string | null;
  }[];
	series_verified_by?: {
		verified: boolean;
    rejection_reason: string | null;
  }[];
}

interface getSeries {
	id: number;
	image: string | null;
	title: string;
	creation_date: Date | null;
	name: string;
	avatar: string | null
	rating?: number;
	series_finished?: Date | null;
	series_started?: Date | null;
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
				published: SeriesStatus.UNPUBLISHED
			}
		});
	}
		
	static async findOne(series_id: number, user_id: number): Promise<seriesOne | false | { notExist: true }> {
		const _series_ = await series.findUnique({
			where: {
				id: series_id,
			},
			select: {
				id: true,
				title: true,
				description: true,
				image: true,
				published: true,
				creation_date: true,
				series_creator: {
					select: {
						user: {
							select: {
								id: true,
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
				series_finished: (user_id === -1)
					? undefined
					: {
						where: {
							series_id,
							user_id
						},
						select: {
							completion_date: true
						}
					},
				series_verified_by: (user_id === -1)
					? undefined
					: {
						where: {
							series_id,
							user_id
						},
						select: {
							user_id: true,
							verified: true,
							rejection_reason: true
						}
					}
			}
		});
		const _rating_ = await userSeriesRating.aggregate({
			where: {
				series_id
			},
			_avg: {
				rating: true
			}
		});

		if (!_series_)
			return { notExist: true };
		const isCreator = _series_.series_creator.findIndex((s) => s.user.id === user_id) !== -1;
		const isVerifiedByUser = _series_.series_verified_by?.findIndex((s) => s.user_id === user_id) !== -1 ?? false;

		return (isCreator || isVerifiedByUser && _series_.published !== 'UNPUBLISHED' || _series_.published === 'PUBLISHED')
			? {
				id: _series_.id,
				title: _series_.title,
				description: _series_.description,
				image: _series_.image,
				rating: _rating_._avg.rating ?? 0,
				published: _series_.published,
				creation_date: _series_.creation_date,
				series_enigma_order: _series_.series_enigma_order.map((e, i) => {
					if (user_id !== -1 && i <= 0) {
						(e.enigma as seriesOneEnigma).finished = (e.enigma.enigma_finished.length <= 0)
							? 'START'
							: 'RESUME';
					} else if (user_id !== -1 && _series_.series_enigma_order[i - 1].enigma.enigma_finished.length > 0) {
						(e.enigma as seriesOneEnigma).finished = (e.enigma.enigma_finished.length <= 0)
							? 'START'
							: 'RESUME';
					} else
						(e.enigma as seriesOneEnigma).finished = 'UNAUTHORIZED';
					return e.enigma as seriesOneEnigma;
				}),
				series_creator: _series_.series_creator.map((e) => e.user),
				series_finished: (_series_.series_finished)
					? _series_.series_finished.map((e) => e.completion_date)
					: undefined,
				series_verified_by: (isCreator)
					? _series_.series_verified_by.map((e) => ({ verified: e.verified, rejection_reason: e.rejection_reason })) ?? undefined
					: undefined
			} as seriesOne
			: false;
	}

	static async findAll(): Promise<Series[] | null> {
		return series.findMany();
	}

	static async findAllPublished(
		user_id: number,
		sort: { key: 'public."Series".title' | 'public."Series".creation_date' | 'rating', value: 'ASC' | 'DESC' },
		lastElement: string | null,
		search?: string
	): Promise<getSeries[] | null> {
		const ascDesc = (sort.value === 'ASC')
			? '>'
			: '<';
		const genWhere = () => {
			let ret = `WHERE public."Series".published = '${SeriesStatus.PUBLISHED}' `;
			if (lastElement !== null && sort.key === 'rating')
				return ret;
			if (lastElement !== null || search)
				ret += 'AND ';
			if (!search && lastElement !== null) {
				ret += `${sort.key} `;
				ret += `${ascDesc} `;
				ret += `${(sort.key === 'public."Series".creation_date')
					? `timestamp without time zone '${lastElement}'`
					: `'${lastElement}'`} `;
				if (search)
					ret += 'AND ';
			}
			if (search)
				ret += `SIMILARITY(public."Series".title, '${search}') > 0.4 OR SIMILARITY(public."User".name, '${search}') > 0.4`;
			return ret;
		};
		const genHaving = () => {
			if (lastElement !== null && sort.key === 'rating')
				return `HAVING TRUNC(COALESCE(AVG(rating), 0), 1) ${ascDesc} ${lastElement}::decimal`;
			return '';
		};

		return (await prisma.$queryRawUnsafe(`
			SELECT public."Series".id, public."Series".image, public."Series".title, public."Series".creation_date,
				public."User".name, public."User".avatar,
				public."SeriesStarted".started_date,
				public."SeriesFinished".completion_date,
				TRUNC(COALESCE(AVG(public."UserSeriesRating".rating), 0), 1) as rating
			FROM public."Series"
			LEFT JOIN public."SeriesCreator" ON public."Series".id = public."SeriesCreator".series_id
			LEFT JOIN public."User" ON public."SeriesCreator".user_id = public."User".id
			LEFT JOIN public."SeriesStarted" ON public."SeriesCreator".user_id = ${user_id}
			LEFT JOIN public."SeriesFinished" ON public."SeriesFinished".user_id = ${user_id}
			LEFT JOIN public."UserSeriesRating" ON public."UserSeriesRating".series_id = public."Series".id
			${genWhere()}
			GROUP BY public."Series".id, public."User".name, public."User".avatar,
				public."SeriesStarted".started_date, public."SeriesFinished".completion_date
			${genHaving()}
			ORDER BY ${sort.key} ${sort.value}
			LIMIT 100
		`));
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

	static async published(series_id: number): Promise<boolean> {
		const _series_ = await series.findUnique({
			where: {
				id: series_id
			},
			select: {
				published: true
			}
		});

		if (!_series_)
			return false;
		return (_series_.published === 'PENDING' || _series_.published === 'PUBLISHED');
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static async findLinkedToUser(user_id: number): Promise<getSeries[]> {
		return (await prisma.$queryRawUnsafe(`
			SELECT public."Series".id, public."Series".image, public."Series".title, public."Series".creation_date,
				public."User".name, public."User".avatar,
				TRUNC(COALESCE(AVG(public."UserSeriesRating".rating), 0), 1) as rating,
				public."SeriesStarted".started_date,
				public."SeriesFinished".completion_date
			FROM public."Series"
			LEFT JOIN public."SeriesCreator" ON public."Series".id = public."SeriesCreator".series_id
			LEFT JOIN public."User" ON public."SeriesCreator".user_id = public."User".id
			LEFT JOIN public."UserSeriesRating" ON public."UserSeriesRating".series_id = public."Series".id
			LEFT JOIN public."SeriesStarted" ON public."SeriesStarted".series_id = public."Series".id AND public."SeriesStarted".user_id = ${user_id}
			LEFT JOIN public."SeriesFinished" ON public."SeriesStarted".series_id = public."Series".id AND public."SeriesFinished".user_id = ${user_id}
			WHERE public."Series".published = '${SeriesStatus.PUBLISHED}'
			GROUP BY public."Series".id, public."User".name, public."User".avatar,
				public."SeriesStarted".started_date,
				public."SeriesFinished".completion_date
			ORDER BY public."Series".creation_date DESC
		`));
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
		return (await prisma.$queryRawUnsafe(`
		SELECT public."Series".id, public."Series".image, public."Series".title,
			public."Series".creation_date, public."User".name, public."User".avatar
		FROM public."Series"
		LEFT JOIN public."SeriesCreator" ON public."Series".id = public."SeriesCreator".series_id
		LEFT JOIN public."User" ON public."SeriesCreator".user_id = public."User".id
		LEFT JOIN public."SeriesVerifiedBy" ON public."SeriesVerifiedBy".series_id = public."Series".id
		WHERE public."Series".published = '${SeriesStatus.PENDING}' AND public."SeriesVerifiedBy".user_id = ${user_id}
		GROUP BY public."Series".id, public."User".name, public."User".avatar,
			public."SeriesVerifiedBy".verified, public."SeriesVerifiedBy".verified_date,
			public."SeriesVerifiedBy".rejection_reason
		ORDER BY public."Series".creation_date DESC
		`));
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
					},
					where: {
						user_id
					}
				}
			}
		});
		if (!_series_)
			return false;
		return (
			(_series_.series_creator.length && _series_.series_creator.findIndex((e) => e.user_id === user_id) !== -1) ||
			(_series_.published === 'PENDING' && _series_.series_verified_by.findIndex((e) => e.user_id === user_id) !== -1) ||
			(_series_.published === 'PUBLISHED' && _series_.series_verified_by.findIndex((e) => e.verified) !== -1)
		);
	}
}