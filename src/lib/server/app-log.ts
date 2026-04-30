import { env } from '$env/dynamic/private';

/** Mindest-Schwere, die noch mit ausgegeben wird (`error` = nur Fehler, `info` = inkl. JSON-Spiegel auf stdout). */
export type AppLogLevel = 'error' | 'warn' | 'info' | 'debug';

const order: Record<AppLogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };

function parseLevel(raw: string | undefined): AppLogLevel | null {
	const v = raw?.trim().toLowerCase();
	if (v === 'error' || v === 'warn' || v === 'info' || v === 'debug') return v;
	return null;
}

function defaultLevel(): AppLogLevel {
	const n = env.NODE_ENV;
	if (n === 'production') return 'info';
	if (n === 'test') return 'error';
	return 'debug';
}

function floor(): AppLogLevel {
	return parseLevel(env.LOG_LEVEL) ?? defaultLevel();
}

function emit(severity: AppLogLevel): boolean {
	return order[severity] <= order[floor()];
}

/** Server-Diagnostik: `LOG_LEVEL` (error|warn|info|debug), Standard je `NODE_ENV`. `error()` immer auf stderr. */
export const appLog = {
	error(...args: unknown[]): void {
		console.error(...args);
	},
	warn(...args: unknown[]): void {
		if (emit('warn')) console.warn(...args);
	},
	info(...args: unknown[]): void {
		if (emit('info')) console.log(...args);
	},
	debug(...args: unknown[]): void {
		if (emit('debug')) console.debug(...args);
	}
};
