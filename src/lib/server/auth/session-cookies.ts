import { randomBytes } from 'node:crypto';

import type { Cookies } from '@sveltejs/kit';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from '$lib/csrf-constants';

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
export const CSRF_COOKIE = CSRF_COOKIE_NAME;

const DAY = 60 * 60 * 24;

/** `Secure` nur wenn sinnvoll (HTTPS). Bei `vite preview` über http: `COOKIE_INSECURE=1` in `.env`. */
function secureCookie(): boolean {
	if (env.COOKIE_INSECURE === '1' || env.COOKIE_INSECURE === 'true') return false;
	return !dev;
}

export function setSessionCookie(cookies: Cookies, jwt: string): void {
	cookies.set(SESSION_COOKIE, jwt, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookie(),
		maxAge: DAY
	});
}

export function setCsrfCookie(cookies: Cookies, token: string): void {
	cookies.set(CSRF_COOKIE, token, {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: secureCookie(),
		maxAge: DAY
	});
}

export function newCsrfValue(): string {
	return randomBytes(32).toString('hex');
}

export function rotateCsrfCookie(cookies: Cookies): string {
	const t = newCsrfValue();
	setCsrfCookie(cookies, t);
	return t;
}

export function clearAuthCookies(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	cookies.delete(CSRF_COOKIE, { path: '/' });
}
