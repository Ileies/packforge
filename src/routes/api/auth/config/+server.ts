import { getAuthPublicConfig } from '$lib/server/auth/auth-service';
import { jsonWithWeakBodyEtag } from '$lib/server/http/conditional-get';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) =>
	jsonWithWeakBodyEtag(request, getAuthPublicConfig(), 'private, max-age=60', { varyCookie: true });
