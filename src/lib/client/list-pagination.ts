/** Seitenzahl aus Gesamtanzahl und Seitengröße (mindestens 1, wie in Bibliothek / Stammdaten). */
export function listTotalPages(total: number, pageSize: number): number {
	const n = Math.max(0, Math.floor(total));
	const size = Math.max(1, Math.floor(pageSize));
	return Math.max(1, Math.ceil(n / size));
}

/**
 * Anzeige „Einträge start–end“ für die aktuelle Seite (1-basiert).
 * `loadedRowCount` = Anzahl der aktuell geladenen Zeilen (letzte Seite oft kleiner als `pageSize`).
 */
export function listPageDisplayedBounds(
	total: number,
	pageIndex: number,
	pageSize: number,
	loadedRowCount: number
): { start: number; end: number } {
	if (total <= 0) return { start: 0, end: 0 };
	const size = Math.max(1, Math.floor(pageSize));
	const idx = Math.max(0, Math.floor(pageIndex));
	const loaded = Math.max(0, Math.floor(loadedRowCount));
	const start = idx * size + 1;
	const end = Math.min(total, idx * size + loaded);
	return { start, end };
}
