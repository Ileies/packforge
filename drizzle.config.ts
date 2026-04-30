import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

const url = process.env.MAIN_DB_PATH ?? 'file:./data/database/packforge.db';

export default defineConfig({
	schema: './src/lib/server/schema/main-schema.ts',
	out: './drizzle/main',
	dialect: 'sqlite',
	dbCredentials: { url }
});
