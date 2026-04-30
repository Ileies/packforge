import { describe, expect, it } from 'vitest';

import { privateEnvSchema } from './validate-env';

const prodJwt = 'y'.repeat(40);
const sampleAzure = {
	AZURE_CLIENT_ID: '3d929ae2-8b8f-40ea-99f3-dbca8dc09a1e',
	AZURE_TENANT_ID: 'd3a48d91-1d39-454c-bab1-cd2eaf5f83da',
	AZURE_REDIRECT_URI: 'https://packforge.example.com/login'
};

describe('privateEnvSchema (ALLOW_DEV_LOGIN + JWT)', () => {
	it('lehnt ALLOW_DEV_LOGIN mit schwachem oder Platzhalter-JWT in development ab', () => {
		const r = privateEnvSchema.safeParse({
			NODE_ENV: 'development',
			JWT_SECRET: 'short',
			ALLOW_DEV_LOGIN: 'true',
			DEV_LOGIN_PASSWORD: undefined,
			COOKIE_INSECURE: undefined,
			...sampleAzure
		});
		expect(r.success).toBe(false);
		expect(r.error?.issues.some((i) => String(i.message).includes('ALLOW_DEV_LOGIN'))).toBe(true);
	});

	it('erlaubt ALLOW_DEV_LOGIN mit starkem JWT in development', () => {
		expect(
			privateEnvSchema.safeParse({
				NODE_ENV: 'development',
				JWT_SECRET: 'z'.repeat(32),
				ALLOW_DEV_LOGIN: 'true',
				DEV_LOGIN_PASSWORD: undefined,
				COOKIE_INSECURE: undefined,
				...sampleAzure
			}).success
		).toBe(true);
	});
});

describe('privateEnvSchema (Production)', () => {
	it('lehnt Dev-Login in production ohne Entra-Optional-Flag ab', () => {
		const r = privateEnvSchema.safeParse({
			NODE_ENV: 'production',
			JWT_SECRET: prodJwt,
			ALLOW_DEV_LOGIN: 'true',
			DEV_LOGIN_PASSWORD: 'sechzehn-zeichen!!',
			COOKIE_INSECURE: undefined,
			AUTH_ENTRA_OPTIONAL_IN_PRODUCTION: undefined,
			...sampleAzure
		});
		expect(r.success).toBe(false);
		expect(r.error?.issues.some((i) => String(i.message).includes('AUTH_ENTRA_OPTIONAL_IN_PRODUCTION'))).toBe(
			true
		);
	});

	it('lehnt Dev-Login in production mit Entra-optional aber ohne/kurzem DEV_LOGIN_PASSWORD ab', () => {
		const kurz = privateEnvSchema.safeParse({
			NODE_ENV: 'production',
			JWT_SECRET: prodJwt,
			ALLOW_DEV_LOGIN: 'true',
			DEV_LOGIN_PASSWORD: '123456789012345',
			COOKIE_INSECURE: undefined,
			AUTH_ENTRA_OPTIONAL_IN_PRODUCTION: 'true',
			...sampleAzure
		});
		expect(kurz.success).toBe(false);
		expect(kurz.error?.issues.some((i) => String(i.message).includes('DEV_LOGIN_PASSWORD'))).toBe(true);

		const fehlt = privateEnvSchema.safeParse({
			NODE_ENV: 'production',
			JWT_SECRET: prodJwt,
			ALLOW_DEV_LOGIN: 'true',
			DEV_LOGIN_PASSWORD: undefined,
			COOKIE_INSECURE: undefined,
			AUTH_ENTRA_OPTIONAL_IN_PRODUCTION: 'true',
			...sampleAzure
		});
		expect(fehlt.success).toBe(false);
	});

	it('erlaubt Dev-Login in production ohne Entra, mit starkem Passwort', () => {
		expect(
			privateEnvSchema.safeParse({
				NODE_ENV: 'production',
				JWT_SECRET: prodJwt,
				ALLOW_DEV_LOGIN: 'true',
				DEV_LOGIN_PASSWORD: 'sechzehn-zeichen-min!!',
				COOKIE_INSECURE: undefined,
				AUTH_ENTRA_OPTIONAL_IN_PRODUCTION: 'true',
				AZURE_CLIENT_ID: undefined,
				AZURE_TENANT_ID: undefined,
				AZURE_REDIRECT_URI: undefined
			}).success
		).toBe(true);
	});

	it('erlaubt production mit ALLOW_DEV_LOGIN unset oder false und gültiger Entra-Konfiguration', () => {
		expect(
			privateEnvSchema.safeParse({
				NODE_ENV: 'production',
				JWT_SECRET: prodJwt,
				ALLOW_DEV_LOGIN: undefined,
				DEV_LOGIN_PASSWORD: undefined,
				COOKIE_INSECURE: undefined,
				...sampleAzure
			}).success
		).toBe(true);
		expect(
			privateEnvSchema.safeParse({
				NODE_ENV: 'production',
				JWT_SECRET: prodJwt,
				ALLOW_DEV_LOGIN: 'false',
				DEV_LOGIN_PASSWORD: undefined,
				COOKIE_INSECURE: undefined,
				...sampleAzure
			}).success
		).toBe(true);
	});

	it('erlaubt production ohne Azure, wenn AUTH_ENTRA_OPTIONAL_IN_PRODUCTION gesetzt ist', () => {
		expect(
			privateEnvSchema.safeParse({
				NODE_ENV: 'production',
				JWT_SECRET: prodJwt,
				ALLOW_DEV_LOGIN: undefined,
				DEV_LOGIN_PASSWORD: undefined,
				COOKIE_INSECURE: undefined,
				AUTH_ENTRA_OPTIONAL_IN_PRODUCTION: 'true',
				AZURE_CLIENT_ID: undefined,
				AZURE_TENANT_ID: undefined,
				AZURE_REDIRECT_URI: undefined
			}).success
		).toBe(true);
	});

	it('lehnt production ohne AZURE_CLIENT_ID ab (ohne Optional-Flag)', () => {
		const r = privateEnvSchema.safeParse({
			NODE_ENV: 'production',
			JWT_SECRET: prodJwt,
			ALLOW_DEV_LOGIN: undefined,
			DEV_LOGIN_PASSWORD: undefined,
			COOKIE_INSECURE: undefined,
			AZURE_TENANT_ID: sampleAzure.AZURE_TENANT_ID,
			AZURE_REDIRECT_URI: sampleAzure.AZURE_REDIRECT_URI
		});
		expect(r.success).toBe(false);
		expect(r.error?.issues.some((i) => String(i.message).includes('AZURE_CLIENT_ID'))).toBe(true);
	});

	it('lehnt localhost-Redirect in production ab', () => {
		const r = privateEnvSchema.safeParse({
			NODE_ENV: 'production',
			JWT_SECRET: prodJwt,
			ALLOW_DEV_LOGIN: undefined,
			DEV_LOGIN_PASSWORD: undefined,
			COOKIE_INSECURE: undefined,
			AZURE_CLIENT_ID: sampleAzure.AZURE_CLIENT_ID,
			AZURE_TENANT_ID: sampleAzure.AZURE_TENANT_ID,
			AZURE_REDIRECT_URI: 'http://localhost:5173/login'
		});
		expect(r.success).toBe(false);
		expect(r.error?.issues.some((i) => String(i.message).includes('localhost'))).toBe(true);
	});

	it('erlaubt AZURE_TENANT_ID=common in production', () => {
		expect(
			privateEnvSchema.safeParse({
				NODE_ENV: 'production',
				JWT_SECRET: prodJwt,
				ALLOW_DEV_LOGIN: undefined,
				DEV_LOGIN_PASSWORD: undefined,
				COOKIE_INSECURE: undefined,
				AZURE_CLIENT_ID: sampleAzure.AZURE_CLIENT_ID,
				AZURE_TENANT_ID: 'common',
				AZURE_REDIRECT_URI: sampleAzure.AZURE_REDIRECT_URI
			}).success
		).toBe(true);
	});
});
