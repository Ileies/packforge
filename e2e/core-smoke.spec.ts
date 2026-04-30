import { expect, test } from '@playwright/test';

import { loginDevAdmin } from './helpers/dev-login';

/**
 * Kernpfad nach Login: Stammdaten, Software-Bibliothek, Formfelder inkl. JSON-Export.
 * Kein Installer-Upload (würde signierte .exe/.msi und Multipart erfordern).
 */
test.describe('Kernpfad (Smoke, nach Dev-Login)', () => {
	test('Stammdaten, Software-Bibliothek, Formfelder-Export', async ({ page }) => {
		await loginDevAdmin(page);

		await page.goto('/stammdaten');
		await expect(page.getByRole('heading', { level: 1, name: /^Stammdaten$/ })).toBeVisible({
			timeout: 20_000
		});

		await page.goto('/software-library');
		await expect(page.getByRole('heading', { level: 1, name: /Software-Bibliothek/ })).toBeVisible({
			timeout: 20_000
		});

		await page.goto('/data-editor');
		await expect(page.getByRole('heading', { level: 1, name: /^Formfelder$/ })).toBeVisible({
			timeout: 20_000
		});
		const exportBtn = page.getByRole('button', { name: 'Export JSON' });
		await expect(exportBtn).toBeEnabled({ timeout: 20_000 });

		const downloadPromise = page.waitForEvent('download');
		await exportBtn.click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toMatch(/formfields-export\.json$/i);
	});
});
