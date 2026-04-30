import { describe, expect, it } from 'vitest';

import { readAceUiThemeFromHtml, subscribeAceUiThemeToHtmlDark } from './ace-theme-from-html-dark';

describe('ace-theme-from-html-dark', () => {
	it('ohne Browser: immer github', () => {
		expect(readAceUiThemeFromHtml()).toBe('github');
	});

	it('Subscribe ohne Browser: kein Callback, Cleanup ist no-op', () => {
		let calls = 0;
		const unsub = subscribeAceUiThemeToHtmlDark(() => {
			calls += 1;
		});
		expect(calls).toBe(0);
		unsub();
	});
});
