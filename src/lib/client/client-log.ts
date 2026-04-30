import { dev } from '$app/environment';

function verboseBrowser(): boolean {
	if (dev) return true;
	const v = import.meta.env.PUBLIC_LOG_VERBOSE?.trim();
	return v === '1' || v === 'true' || v?.toLowerCase() === 'yes';
}

/** Client-Diagnostik: nur in `dev` oder bei `PUBLIC_LOG_VERBOSE=1|true|yes`. */
export const clientLog = {
	warn(...args: unknown[]): void {
		if (verboseBrowser()) console.warn(...args);
	},
	debug(...args: unknown[]): void {
		if (verboseBrowser()) console.debug(...args);
	}
};
