import { SECTION_PERMISSIONS } from '$lib/app/section-permissions';

/** Erstes URL-Segment, wenn es einer geschützten App-Sektion entspricht (z. B. `software-library`). */
export function pathnameToGuardedSection(pathname: string): string | null {
	const head = pathname.split('/').filter(Boolean)[0];
	if (!head) return null;
	return head in SECTION_PERMISSIONS ? head : null;
}

/** Gleiche Regel wie Sidebar: mindestens eine der Sektions-Berechtigungen. */
export function userMayAccessSectionWithPerms(
	section: string,
	permissions: string[] | undefined
): boolean {
	const req = SECTION_PERMISSIONS[section];
	if (!req?.length) return true;
	return req.some((p) => permissions?.includes(p));
}

export function userMayAccessPathnameWithPerms(
	pathname: string,
	permissions: string[] | undefined
): boolean {
	const section = pathnameToGuardedSection(pathname);
	if (!section) return true;
	return userMayAccessSectionWithPerms(section, permissions);
}
