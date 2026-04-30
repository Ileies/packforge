import { getHelpLinks } from '$lib/server/help-links';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return {
		helpLinks: getHelpLinks(),
		openPortfolioDemo: process.env.PUBLIC_OPEN_PORTFOLIO_MODE === 'true'
	};
};
