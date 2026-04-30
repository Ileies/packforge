import { eq, sql } from 'drizzle-orm';

import { env } from '$env/dynamic/private';

import { getMainDb } from '../db/main-db';
import { aiDailyUsage } from '../schema/main-schema';

export function getAiDailyMaxRequests(): number | null {
	const raw = env.AI_DAILY_MAX_REQUESTS;
	if (raw === undefined || raw === '') return null;
	const n = Number.parseInt(String(raw), 10);
	return Number.isFinite(n) && n > 0 ? n : null;
}

/** UTC-Datum `YYYY-MM-DD` (ISO). */
export function todayUtcDay(): string {
	return new Date().toISOString().slice(0, 10);
}

export function getAiDailyUsageCount(day: string): number {
	const row = getMainDb()
		.select({ count: aiDailyUsage.count })
		.from(aiDailyUsage)
		.where(eq(aiDailyUsage.day, day))
		.get();
	return row?.count ?? 0;
}

export function assertAiDailyBudgetAllows(): { ok: true } | { ok: false; message: string } {
	const max = getAiDailyMaxRequests();
	if (max == null) return { ok: true };
	const day = todayUtcDay();
	const used = getAiDailyUsageCount(day);
	if (used >= max) {
		return {
			ok: false,
			message: `Tageslimit für KI-Anfragen erreicht (${max} pro Tag, UTC). Morgen erneut oder Limit in der Konfiguration anpassen.`
		};
	}
	return { ok: true };
}

/** Nach erfolgreicher KI-Anfrage aufrufen (wenn ein Limit gesetzt ist). */
export function recordAiDailySuccess(): void {
	if (getAiDailyMaxRequests() == null) return;
	const day = todayUtcDay();
	getMainDb()
		.insert(aiDailyUsage)
		.values({ day, count: 1 })
		.onConflictDoUpdate({
			target: aiDailyUsage.day,
			set: { count: sql`${aiDailyUsage.count} + 1` }
		})
		.run();
}
