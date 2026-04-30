import { describe, expect, it } from 'vitest';

import { cmpSemVerLike, groupSoftwareSummaries } from './script-editor-logic';
import type { SoftwareSummary } from './script-editor-types';

describe('cmpSemVerLike', () => {
	it('sorts numeric version segments', () => {
		expect(cmpSemVerLike('2.0', '10.0')).toBeLessThan(0);
		expect(cmpSemVerLike('10.0', '2.0')).toBeGreaterThan(0);
	});
});

describe('groupSoftwareSummaries', () => {
	it('groups by name and sorts versions within group', () => {
		const rows: SoftwareSummary[] = [
			{ id: 1, name: 'App', version: '2.0', file_name: 'a.msi' },
			{ id: 2, name: 'App', version: '1.0', file_name: 'b.msi' },
			{ id: 3, name: 'Other', version: null, file_name: 'c.exe' }
		];
		const grouped = groupSoftwareSummaries(rows);
		expect(grouped.map(([k]) => k)).toEqual(['App', 'Other']);
		const appItems = grouped.find(([k]) => k === 'App')?.[1] ?? [];
		expect(appItems.map((r) => r.version)).toEqual(['1.0', '2.0']);
	});
});
