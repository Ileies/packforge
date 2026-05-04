import { PRODUCT_PUBLIC_ORIGIN } from '$lib/app/brand';
import type { RequestHandler } from './$types';

const publicRoutes = [
	{ path: '/login', priority: '0.8', changefreq: 'monthly' },
	{ path: '/impressum', priority: '0.3', changefreq: 'yearly' },
	{ path: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
	{ path: '/nutzungsbedingungen', priority: '0.3', changefreq: 'yearly' }
];

export const GET: RequestHandler = () => {
	const urls = publicRoutes
		.map(
			({ path, priority, changefreq }) =>
				`  <url>\n    <loc>${PRODUCT_PUBLIC_ORIGIN}${path}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
		)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
