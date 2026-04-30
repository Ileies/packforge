import { env } from '$env/dynamic/private';

import { rateLimitCategory } from './rate-limit-paths';
import { createSlidingWindowLimiter } from './rate-limit-window';

const loginLimiter = createSlidingWindowLimiter();
const aiLimiter = createSlidingWindowLimiter();
const apiWriteLimiter = createSlidingWindowLimiter();

function parsePositiveInt(name: string, fallback: number): number {
	const raw = env[name];
	if (raw === undefined || raw === '') return fallback;
	const n = Number.parseInt(String(raw), 10);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function isRateLimitDisabled(): boolean {
	return env.RATE_LIMIT_DISABLED === '1' || env.RATE_LIMIT_DISABLED === 'true';
}

function loginLimits(): { max: number; windowMs: number } {
	const windowSec = parsePositiveInt('RATE_LIMIT_LOGIN_WINDOW_SEC', 60);
	return {
		max: parsePositiveInt('RATE_LIMIT_LOGIN_MAX', 20),
		windowMs: windowSec * 1000
	};
}

function aiLimits(): { max: number; windowMs: number } {
	const windowSec = parsePositiveInt('RATE_LIMIT_AI_WINDOW_SEC', 60);
	return {
		max: parsePositiveInt('RATE_LIMIT_AI_MAX', 90),
		windowMs: windowSec * 1000
	};
}

function apiWriteLimits(): { max: number; windowMs: number } {
	const windowSec = parsePositiveInt('RATE_LIMIT_API_WRITE_WINDOW_SEC', 60);
	return {
		max: parsePositiveInt('RATE_LIMIT_API_WRITE_MAX', 60),
		windowMs: windowSec * 1000
	};
}

export { rateLimitCategory };

export type RateLimitOutcome = { limited: false } | { limited: true; retryAfterSec: number };

/**
 * @param clientIp von `event.getClientAddress()` — nicht aus Rohheadern ohne Reverse-Proxy-Kontext.
 */
export function checkRateLimit(clientIp: string, pathname: string, method: string): RateLimitOutcome {
	if (isRateLimitDisabled()) return { limited: false };

	const cat = rateLimitCategory(pathname, method);
	if (!cat) return { limited: false };

	const key = `${cat}:${clientIp}`;
	const limits = cat === 'login' ? loginLimits() : cat === 'ai' ? aiLimits() : apiWriteLimits();
	const limiter = cat === 'login' ? loginLimiter : cat === 'ai' ? aiLimiter : apiWriteLimiter;
	const { allowed, retryAfterSec } = limiter(key, limits.max, limits.windowMs);
	if (allowed) return { limited: false };
	return { limited: true, retryAfterSec };
}
