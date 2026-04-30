import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

const url = process.env.PACKAGES_DB_PATH ?? 'file:./data/database/packages.db';

export default defineConfig({
	schema: './src/lib/server/schema/packages.ts',
	out: './drizzle/packages',
	dialect: 'sqlite',
	dbCredentials: { url }
});
