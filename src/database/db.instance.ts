import { PrismaClient } from '@prisma/client';
import { log } from 'lib/log';

export const prisma = new PrismaClient({
	log: [
		{ emit: 'event', level: 'query' },
		{ emit: 'event', level: 'error' },
		{ emit: 'event', level: 'info' },
		{ emit: 'event', level: 'warn' }
	]
});
prisma.$on('query', (e) => {
	log.psql('[QUERY]', e.query, `- Params: ${e.params}`, '|', e.duration, 'ms');
});
prisma.$on('error', (e) => {
	log.psql('[ERROR]', e.message, 'at', e.timestamp);
});
prisma.$on('info', (e) => {
	log.psql('[INFO]', e.message, 'at', e.timestamp);
});
prisma.$on('warn', (e) => {
	log.psql('[WARN]', e.message, 'at', e.timestamp);
});

export const {
	achievement, achievementCreator,
	enigma, enigmaContent, enigmaCreator, enigmaFinished, enigmaSolution,
	series, seriesStarted, seriesCreator, seriesEnigmaOrder, seriesVerifiedBy, seriesFinished,
	user, userAchievement, userBlocked, userResetPassword, userSeriesRating,
	token
} = prisma;
export default prisma;
