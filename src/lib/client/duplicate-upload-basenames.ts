/**
 * Dateinamen, die in der Liste mehrfach vorkommen (Vergleich ohne Groß-/Kleinschreibung).
 * Reihenfolge: erstes Auftreten jedes Duplikat-Namens (Original-Schreibweise).
 */
export function duplicateUploadBasenames(files: { name: string }[]): string[] {
	const seen = new Set<string>();
	const dup = new Set<string>();
	for (const f of files) {
		const k = f.name.toLowerCase();
		if (seen.has(k)) dup.add(f.name);
		else seen.add(k);
	}
	return [...dup];
}
