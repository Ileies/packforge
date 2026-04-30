import { describe, expect, it } from 'vitest';

import { initialFormDataObjectFromFormfieldRows } from './software-initial-form-data';

describe('initialFormDataObjectFromFormfieldRows', () => {
	it('überspringt Spacer und setzt Defaults', () => {
		const o = initialFormDataObjectFromFormfieldRows([
			{ label: 'AppName', is_spacer: false, default_value: null },
			{ label: 'X', is_spacer: true, default_value: 'ignored' },
			{ label: 'AppVendor', is_spacer: false, default_value: 'ACME' }
		]);
		expect(o).toEqual({ AppName: '', AppVendor: 'ACME' });
		expect('X' in o).toBe(false);
	});
});
