/** Einheitliche Locale für Zahlen/Datum (Roadmap §29); UI bleibt DE-first (`app.html lang="de"`). */
export const APP_LOCALE = 'de-DE';

function parseAppDate(isoOrSqlite: string | null | undefined): Date | null {
	if (isoOrSqlite == null || isoOrSqlite === '') return null;
	const normalized = isoOrSqlite.includes('T') ? isoOrSqlite : isoOrSqlite.replace(' ', 'T');
	const d = new Date(normalized);
	return Number.isNaN(d.getTime()) ? null : d;
}

/** SQLite-`datetime` oder ISO-String → kurze lokale Anzeige. */
export function formatDateTime(isoOrSqlite: string | null | undefined): string {
	const d = parseAppDate(isoOrSqlite);
	if (!d) {
		if (isoOrSqlite == null || isoOrSqlite === '') return '—';
		return String(isoOrSqlite);
	}
	return new Intl.DateTimeFormat(APP_LOCALE, { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

/** Kalendertage zwischen zwei Zeitpunkten (lokale Mitternacht), `earlier` liegt vor `later`. */
function calendarDaysFromEarlierToLater(earlier: Date, later: Date): number {
	const e = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
	const l = new Date(later.getFullYear(), later.getMonth(), later.getDate());
	return Math.round((l.getTime() - e.getTime()) / 86400000);
}

/**
 * Zusatz zu einem absoluten Datum in Listen: Badge „Heute“/„Gestern“ und relative Kurzphrase (de).
 * `suffix` entfällt bei sehr alten Einträgen (> maxDaysForSuffix), damit die Zeile nicht laut wird.
 */
export function formatListRelativeHint(
	isoOrSqlite: string | null | undefined,
	options?: { now?: Date; maxDaysForSuffix?: number }
): { badge: string | null; suffix: string | null; absoluteTitle: string } | null {
	const d = parseAppDate(isoOrSqlite);
	if (!d) return null;
	const now = options?.now ?? new Date();
	const maxDays = options?.maxDaysForSuffix ?? 14;
	const absoluteTitle = formatDateTime(isoOrSqlite);
	const diffMs = now.getTime() - d.getTime();
	if (diffMs < 0) return { badge: null, suffix: null, absoluteTitle };

	const diffSec = Math.floor(diffMs / 1000);
	const daysAgo = calendarDaysFromEarlierToLater(d, now);
	if (daysAgo > maxDays) return { badge: null, suffix: null, absoluteTitle };

	const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });

	if (daysAgo === 0) {
		if (diffSec < 45) return { badge: 'Heute', suffix: 'gerade eben', absoluteTitle };
		if (diffSec < 3600) {
			return { badge: 'Heute', suffix: rtf.format(-Math.floor(diffSec / 60), 'minute'), absoluteTitle };
		}
		return { badge: 'Heute', suffix: rtf.format(-Math.floor(diffSec / 3600), 'hour'), absoluteTitle };
	}
	if (daysAgo === 1) return { badge: 'Gestern', suffix: null, absoluteTitle };
	return { badge: null, suffix: rtf.format(-daysAgo, 'day'), absoluteTitle };
}
