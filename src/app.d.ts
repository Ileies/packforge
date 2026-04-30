// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Pro Request (Hooks); Korrelation mit HTTP-Access- und Audit-Logs. */
			traceId: string;
			/**
			 * Nach Session-Gate in `hooks.server.ts`: gesetzt, wenn die Anfrage ein geschütztes
			 * `/api/*` ist und ein gültiges Session-Cookie mitgeliefert wurde.
			 */
			sessionUser?: import('$lib/server/auth/session-jwt').SessionPayload;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
