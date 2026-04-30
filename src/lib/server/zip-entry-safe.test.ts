import { describe, expect, it } from 'vitest';

import { safeZipArchiveRelativePath } from './zip-entry-safe';

describe('safeZipArchiveRelativePath', () => {
	it('akzeptiert einfache relative Pfade', () => {
		expect(safeZipArchiveRelativePath('setup.exe')).toBe('setup.exe');
		expect(safeZipArchiveRelativePath('sub/foo.msi')).toBe('sub/foo.msi');
	});

	it('lehnt Traversal und Absolutpfade ab', () => {
		expect(safeZipArchiveRelativePath('../evil')).toBe(null);
		expect(safeZipArchiveRelativePath('a/../../b')).toBe(null);
		expect(safeZipArchiveRelativePath('/etc/passwd')).toBe(null);
	});

	it('lehnt nur Punkte-Segmente ab', () => {
		expect(safeZipArchiveRelativePath('.')).toBe(null);
	});
});
