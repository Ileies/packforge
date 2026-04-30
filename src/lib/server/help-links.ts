import { env } from '$env/dynamic/private';
import type { HelpLink } from '$lib/types/help-link';

export type { HelpLink };

const MAX_JSON_LINKS = 8;
const MAX_LABEL_LEN = 80;

/** Nur http(s), keine javascript:- oder andere Schemes. */
export function isSafeHttpUrl(raw: string): boolean {
	const s = raw.trim();
	if (!s) return false;
	try {
		const u = new URL(s);
		return u.protocol === 'https:' || u.protocol === 'http:';
	} catch {
		return false;
	}
}

function trimLabel(s: string): string {
	const t = s.trim().slice(0, MAX_LABEL_LEN);
	return t || 'Link';
}

type JsonEntry = { label?: unknown; href?: unknown };

function parseHelpLinksJson(raw: string | undefined): HelpLink[] | null {
	if (raw == null || !String(raw).trim()) return null;
	let parsed: unknown;
	try {
		parsed = JSON.parse(String(raw).trim());
	} catch {
		return null;
	}
	if (!Array.isArray(parsed)) return null;
	const out: HelpLink[] = [];
	for (const item of parsed.slice(0, MAX_JSON_LINKS)) {
		if (!item || typeof item !== 'object') continue;
		const e = item as JsonEntry;
		const label = typeof e.label === 'string' ? trimLabel(e.label) : '';
		const href = typeof e.href === 'string' ? e.href.trim() : '';
		if (!label || !isSafeHttpUrl(href)) continue;
		out.push({ label, href });
	}
	return out.length ? out : null;
}

/**
 * Konfigurierbare Hilfe-Links (Wiki, Confluence, …) für die App-Shell.
 *
 * `HELP_LINKS_JSON` hat Vorrang (Array von `{ "label", "href" }`), sonst
 * werden gesetzte `HELP_DOCUMENTATION_URL`, `HELP_WIKI_URL`, `HELP_CONFLUENCE_URL`
 * in dieser Reihenfolge übernommen.
 *
 * Mehrere Einträge: in der Shell ein ausklappbarer **Hilfe**-Block (`app-shell-help-links.svelte`).
 */
export function parseHelpLinksFromEnv(e: {
	HELP_LINKS_JSON?: string | undefined;
	HELP_DOCUMENTATION_URL?: string | undefined;
	HELP_WIKI_URL?: string | undefined;
	HELP_CONFLUENCE_URL?: string | undefined;
}): HelpLink[] {
	const fromJson = parseHelpLinksJson(e.HELP_LINKS_JSON);
	if (fromJson) return fromJson;

	const out: HelpLink[] = [];
	const doc = e.HELP_DOCUMENTATION_URL?.trim();
	if (doc && isSafeHttpUrl(doc)) out.push({ label: 'Dokumentation', href: doc });
	const wiki = e.HELP_WIKI_URL?.trim();
	if (wiki && isSafeHttpUrl(wiki)) out.push({ label: 'Wiki', href: wiki });
	const conf = e.HELP_CONFLUENCE_URL?.trim();
	if (conf && isSafeHttpUrl(conf)) out.push({ label: 'Confluence', href: conf });
	return out;
}

export function getHelpLinks(): HelpLink[] {
	return parseHelpLinksFromEnv({
		HELP_LINKS_JSON: env.HELP_LINKS_JSON,
		HELP_DOCUMENTATION_URL: env.HELP_DOCUMENTATION_URL,
		HELP_WIKI_URL: env.HELP_WIKI_URL,
		HELP_CONFLUENCE_URL: env.HELP_CONFLUENCE_URL
	});
}
