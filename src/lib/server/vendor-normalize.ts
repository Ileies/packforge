/**
 * Vendor-Strings für Anzeige/Speicherung (ohne semantische Umbenennung).
 * Trim, Unicode-NFKC, zusammenziehen von Whitespace.
 */
export function sanitizeVendorDisplayString(raw: string): string {
	let s = String(raw ?? '')
		.normalize('NFKC')
		.trim();
	s = s.replace(/\s+/g, ' ');
	return s;
}

/** Bekannte Ticker/Kürzel → kanonischer Wortlaut vor weiterer Normalisierung (nur Kleinbuchstaben-Keys). */
const VENDOR_TOKEN_ALIASES: Record<string, string> = {
	msft: 'microsoft',
	goog: 'google',
	googl: 'google',
	meta: 'meta platforms',
	fb: 'meta platforms',
	orcl: 'oracle',
	adbe: 'adobe',
	hpq: 'hewlett packard',
	hpe: 'hewlett packard enterprise'
};

/** Häufige Rechtsform-Zusätze am Ende (nach Tokenisierung, Kleinbuchstaben). „Company“ absichtlich weggelassen (zu allgemein). */
const TRAILING_LEGAL_RE =
	/\s+(incorporated|corporation|limited|aktiengesellschaft|gmbh|plc|llc|l\s*l\s*c|ltd|corp|inc|kg|ohg|ug|se|s\s*a\s*s|s\s*a|n\s*v|b\s*v)(\.|$)/i;

/**
 * Stabiler Vergleichsschlüssel („Microsoft Corp.“ ≈ „MSFT“ nach Alias, „Oracle Ltd“ ≈ „ORACLE“).
 * Nur für Logik/Vergleich, nicht für UI.
 */
export function normalizeVendorKey(raw: string): string {
	let s = String(raw ?? '')
		.normalize('NFKC')
		.trim()
		.toLowerCase();
	s = s.replace(/&/g, ' and ');
	s = s.replace(/[^a-z0-9\s]/g, ' ');
	s = s.replace(/\s+/g, ' ').trim();
	const alias = VENDOR_TOKEN_ALIASES[s];
	if (alias) s = alias;

	for (let i = 0; i < 12; i++) {
		const tokens = s.split(/\s+/).filter(Boolean);
		if (tokens.length <= 1) break;
		const next = s.replace(TRAILING_LEGAL_RE, '').replace(/\s+/g, ' ').trim();
		if (next === s) break;
		s = next;
	}

	/** „Foo AG“ → „Foo“ (nur letztes Token). */
	{
		const tokens = s.split(/\s+/).filter(Boolean);
		if (tokens.length > 1 && /^ag\.?$/i.test(tokens[tokens.length - 1]!)) {
			s = tokens.slice(0, -1).join(' ');
		}
	}

	return s.replace(/\s+/g, ' ').trim();
}

/** Zwei Vendor-Strings gelten als dieselbe Firma im Sinne des Vergleichsschlüssels. */
export function vendorKeysEqual(a: string, b: string): boolean {
	return normalizeVendorKey(a) === normalizeVendorKey(b);
}

/**
 * Wendet {@link sanitizeVendorDisplayString} auf alle Keys aus `vendorFieldLabels` an (flaches JSON-Objekt).
 */
export function applyVendorSanitizeToFormData(
	formData: unknown,
	vendorFieldLabels: readonly string[]
): unknown {
	if (formData === null || formData === undefined) return formData;
	if (typeof formData !== 'object' || Array.isArray(formData)) return formData;
	const labels = new Set(vendorFieldLabels.filter(Boolean));
	if (!labels.size) return formData;
	const obj = formData as Record<string, unknown>;
	const out: Record<string, unknown> = { ...obj };
	for (const k of labels) {
		if (!(k in out)) continue;
		const v = out[k];
		if (typeof v === 'string') out[k] = sanitizeVendorDisplayString(v);
	}
	return out;
}
