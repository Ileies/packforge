/** Oberflächen-Daten für einheitliche API-/Netzwerk-Fehleranzeige. */
export type ApiErrorSurface = {
	message: string;
	status?: number;
	code?: string;
	docRef?: string;
};

export function msgErr(message: string): ApiErrorSurface {
	return { message };
}

export function fromJsonErr(r: {
	error: string;
	status: number;
	code?: string;
	docRef?: string;
}): ApiErrorSurface {
	return { message: r.error, status: r.status, code: r.code, docRef: r.docRef };
}

/** Kurztitel nach HTTP-Status (ohne Rohtext). */
export function titleForHttpError(status?: number): string {
	if (status === undefined) return 'Hinweis';
	if (status === 401) return 'Nicht angemeldet oder Sitzung abgelaufen';
	if (status === 403) return 'Keine Berechtigung';
	if (status === 404) return 'Eintrag nicht gefunden';
	if (status === 409) return 'Konflikt mit vorhandenen Daten';
	if (status === 429) return 'Zu viele Anfragen';
	if (status >= 500) return 'Serverfehler';
	if (status >= 400) return 'Anfrage fehlgeschlagen';
	return 'Hinweis';
}

export function formatErrorDiagnostic(s: ApiErrorSurface): string {
	const lines: string[] = [];
	if (s.status != null) lines.push(`HTTP ${s.status}`);
	if (s.code) lines.push(`Code: ${s.code}`);
	if (s.docRef) lines.push(`Dokumentation: ${s.docRef}`);
	lines.push(s.message);
	return lines.join('\n');
}
