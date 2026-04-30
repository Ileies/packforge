import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { loginDevAdmin } from './helpers/dev-login';

/** WCAG-orientiert: kritische und schwere axe-Verstöße (entspricht vielen AA-Checks). */
async function expectNoCriticalOrSerious(page: import('@playwright/test').Page, context: string) {
	const results = await new AxeBuilder({ page }).analyze();
	const bad = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
	expect(bad, `${context}\n${JSON.stringify(bad, null, 2)}`).toHaveLength(0);
}

test.describe('Barrierefreiheit Kernpfade (axe, kritisch/schwer)', () => {
	test('Login', async ({ page }) => {
		await page.goto('/login');
		await expectNoCriticalOrSerious(page, '/login');
	});

	test('Rechtliche Platzhalter-Seiten', async ({ page }) => {
		for (const path of ['/impressum', '/datenschutz', '/nutzungsbedingungen'] as const) {
			await page.goto(path);
			await expectNoCriticalOrSerious(page, path);
		}
	});

	test('Angemeldet: Start, Bibliothek, Maker, Editor, Vorlagen, Daten, Einstellungen', async ({ page }) => {
		await loginDevAdmin(page);

		const paths: [string, { name: RegExp }][] = [
			['/welcome', { name: /Pakete planen/ }],
			['/software-library', { name: /Software-Bibliothek/ }],
			['/script-maker', { name: /Script Maker/ }],
			['/script-editor', { name: /Script-Editor/ }],
			['/template-editor', { name: /Template-Editor/ }],
			['/data-editor', { name: /Formfelder/ }],
			['/stammdaten', { name: /^Stammdaten$/ }],
			['/settings', { name: /^Einstellungen$/ }]
		];

		for (const [path, { name }] of paths) {
			await page.goto(path);
			await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 });
			await expectNoCriticalOrSerious(page, path);
		}
	});
});
