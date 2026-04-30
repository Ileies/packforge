/** Sicheres JSON parsen für Formular-/DB-Felder (kein Throw). */
export function safeJson<T>(raw: string | null): T | null {
	if (raw == null || raw === '') return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}
