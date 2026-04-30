import { expect, test } from '@playwright/test';

/** Programmatischer Dev-Login (wie in der lokalen / CI-Umgebung mit ALLOW_DEV_LOGIN). */
export async function loginDevAdmin(page: import('@playwright/test').Page): Promise<void> {
	await page.goto('/login');
	const password = process.env.DEV_LOGIN_PASSWORD?.trim() || undefined;
	const ok = await page.evaluate(async (pwd) => {
		const body: { role: string; password?: string } = { role: 'Admin' };
		if (pwd) body.password = pwd;
		const r = await fetch('/api/auth/dev-login', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		return r.ok;
	}, password ?? '');
	if (!ok) {
		test.skip(
			true,
			'Dev-Login nicht möglich (z. B. ALLOW_DEV_LOGIN=false, JWT/validate-env, oder falsches DEV_LOGIN_PASSWORD).'
		);
	}
	await page.goto('/welcome');
	await expect(page.getByRole('heading', { level: 1, name: /Pakete planen/ })).toBeVisible({
		timeout: 20_000
	});
}
