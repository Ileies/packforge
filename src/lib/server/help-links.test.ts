import { describe, expect, it } from 'vitest';

import { isSafeHttpUrl, parseHelpLinksFromEnv } from './help-links';

describe('isSafeHttpUrl', () => {
	it('akzeptiert http und https', () => {
		expect(isSafeHttpUrl('https://wiki.example.com/x')).toBe(true);
		expect(isSafeHttpUrl('http://localhost/docs')).toBe(true);
	});
	it('lehnt andere Schemes ab', () => {
		expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
		expect(isSafeHttpUrl('data:text/html,hi')).toBe(false);
		expect(isSafeHttpUrl('')).toBe(false);
	});
});

describe('parseHelpLinksFromEnv', () => {
	it('nutzt benannte URLs in fester Reihenfolge', () => {
		expect(
			parseHelpLinksFromEnv({
				HELP_WIKI_URL: 'https://wiki.corp/',
				HELP_DOCUMENTATION_URL: 'https://docs.corp/',
				HELP_CONFLUENCE_URL: 'https://conf.corp/'
			})
		).toEqual([
			{ label: 'Dokumentation', href: 'https://docs.corp/' },
			{ label: 'Wiki', href: 'https://wiki.corp/' },
			{ label: 'Confluence', href: 'https://conf.corp/' }
		]);
	});
	it('HELP_LINKS_JSON überschreibt Einzel-URLs', () => {
		const json = JSON.stringify([
			{ label: 'Handbuch', href: 'https://a.example/h' },
			{ label: 'X', href: 'javascript:void(0)' }
		]);
		expect(
			parseHelpLinksFromEnv({
				HELP_LINKS_JSON: json,
				HELP_WIKI_URL: 'https://ignored/'
			})
		).toEqual([{ label: 'Handbuch', href: 'https://a.example/h' }]);
	});
	it('liefert leeres Array wenn nichts gültig', () => {
		expect(parseHelpLinksFromEnv({})).toEqual([]);
		expect(parseHelpLinksFromEnv({ HELP_WIKI_URL: 'not-a-url' })).toEqual([]);
	});
});
