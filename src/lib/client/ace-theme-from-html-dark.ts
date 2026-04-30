export type AceUiTheme = 'github' | 'one_dark';

function inBrowser(): boolean {
	return typeof document !== 'undefined';
}

export function readAceUiThemeFromHtml(): AceUiTheme {
	if (!inBrowser()) return 'github';
	return document.documentElement.classList.contains('dark') ? 'one_dark' : 'github';
}

/** Sofort synchronisieren und bei `class`-Änderungen an `<html>` (App-Shell Dark Mode). */
export function subscribeAceUiThemeToHtmlDark(set: (t: AceUiTheme) => void): () => void {
	if (!inBrowser()) return () => {};
	set(readAceUiThemeFromHtml());
	const el = document.documentElement;
	const obs = new MutationObserver(() => set(readAceUiThemeFromHtml()));
	obs.observe(el, { attributes: true, attributeFilter: ['class'] });
	return () => obs.disconnect();
}
