import type { Changes } from 'bun:sqlite';

/**
 * Drizzle `bun-sqlite` setzt TRunResult auf `void` (siehe `SQLiteBunDatabase`), obwohl
 * {@link import('drizzle-orm/bun-sqlite').PreparedQuery.prototype.run} zur Laufzeit `Changes` liefert.
 */
export function sqliteRunResult(r: void): Changes {
	return r as unknown as Changes;
}
