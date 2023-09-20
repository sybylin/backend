import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { DB } from '@/kysely/types';

const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: new Pool({
			database: 'sibyllin',
			host: 'localhost',
			user: 'postgresql',
			password: 'root',
			port: 5432,
			max: 10
		})
	})
});

export default db;
