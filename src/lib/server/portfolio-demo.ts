import type { SessionPayload } from '$lib/server/auth/session-jwt';

/** Öffentliche Portfolio-Demo: Gast-Session ohne Login (siehe `PUBLIC_OPEN_PORTFOLIO_MODE`). */
export function isOpenPortfolioDemo(): boolean {
	return process.env.PUBLIC_OPEN_PORTFOLIO_MODE === 'true';
}

/** Stabiler technischer Nutzer für Logs; Rolle `PortfolioGast` in `roles.ts`. */
export const PORTFOLIO_GUEST_SESSION: SessionPayload = {
	username: 'portfolio-gast',
	id: 'portfolio-gast',
	role: 'PortfolioGast',
	displayName: 'Öffentliche Demo',
	entraRoles: [],
	entraGroups: []
};
