import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Login-Seite lädt', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByText('Microsoft Entra ID')).toBeVisible();
});

test('Login-Seite ohne kritische/schwere axe-Verstöße', async ({ page }) => {
	await page.goto('/login');
	const results = await new AxeBuilder({ page }).analyze();
	const bad = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
	expect(bad, JSON.stringify(bad, null, 2)).toHaveLength(0);
});
