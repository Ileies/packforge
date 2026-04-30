export type EntraClaims = {
	preferred_username?: string;
	email?: string;
	upn?: string;
	unique_name?: string;
	name?: string;
	oid?: string;
	sub?: string;
	roles?: string[];
	groups?: string[];
};

export function getEntraUserInfo(claims: EntraClaims) {
	const username = claims.preferred_username || claims.email || claims.upn || claims.unique_name || 'unknown';
	const displayName = (claims.name as string) || username;
	const userId = (claims.oid as string) || (claims.sub as string) || username;
	const entraRoles = claims.roles || [];
	const entraGroups = claims.groups || [];

	let role = 'Besucher';
	if (entraRoles.includes('Admin') || entraRoles.includes('Administrator')) role = 'Admin';
	else if (entraRoles.includes('Mitarbeiter') || entraRoles.includes('Employee')) role = 'Mitarbeiter';
	else if (entraRoles.includes('Besucher') || entraRoles.includes('Visitor')) role = 'Besucher';

	return {
		username,
		displayName,
		id: userId,
		role,
		entraRoles,
		entraGroups
	};
}
