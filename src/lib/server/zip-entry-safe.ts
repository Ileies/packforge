/**
 * Verhindert Zip-Slip / Path-Traversal in Archiv-Einträgen (Roadmap §3).
 * Nur relative Segmente ohne `..`, ohne absoluten Pfad.
 */
export function safeZipArchiveRelativePath(userPath: string): string | null {
	const raw = String(userPath ?? '')
		.trim()
		.replace(/\\/g, '/');
	if (!raw || raw.startsWith('/')) return null;
	for (let i = 0; i < raw.length; i++) {
		const c = raw.charCodeAt(i);
		if (c < 32) return null;
	}
	const segments = raw.split('/').filter((s) => s.length > 0);
	for (const seg of segments) {
		if (seg === '..' || seg === '.') return null;
	}
	const joined = segments.join('/');
	return joined.length > 0 ? joined : null;
}
