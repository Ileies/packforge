import { describe, expect, it } from 'vitest';

import {
	applyVendorSanitizeToFormData,
	normalizeVendorKey,
	sanitizeVendorDisplayString,
	vendorKeysEqual
} from './vendor-normalize';

describe('sanitizeVendorDisplayString', () => {
	it('trimmt und fasst Whitespace zusammen', () => {
		expect(sanitizeVendorDisplayString('  Foo\u3000  Bar  ')).toBe('Foo Bar');
	});
});

describe('normalizeVendorKey', () => {
	it('gleicht Rechtsform und Interpunktion aus', () => {
		expect(normalizeVendorKey('Microsoft Corp.')).toBe(normalizeVendorKey('Microsoft Corporation'));
		expect(normalizeVendorKey('ORACLE LTD')).toBe(normalizeVendorKey('Oracle Ltd.'));
	});

	it('mappt gängige Ticker-Kürzel', () => {
		expect(normalizeVendorKey('MSFT')).toBe(normalizeVendorKey('Microsoft'));
		expect(normalizeVendorKey('ORCL')).toBe(normalizeVendorKey('Oracle Corporation'));
	});

	it('entfernt deutsche Rechtsform am Ende', () => {
		expect(normalizeVendorKey('Siemens AG')).toBe('siemens');
		expect(normalizeVendorKey('ACME GmbH')).toBe('acme');
	});
});

describe('vendorKeysEqual', () => {
	it('erkennt semantisch gleiche Vendor-Strings', () => {
		expect(vendorKeysEqual('Microsoft Corp.', 'MSFT')).toBe(true);
	});
});

describe('applyVendorSanitizeToFormData', () => {
	it('bearbeitet nur angegebene Label-Keys', () => {
		const out = applyVendorSanitizeToFormData({ AppVendor: '  Adobe  Inc.  ', AppName: ' Reader ' }, [
			'AppVendor'
		]) as Record<string, string>;
		expect(out.AppVendor).toBe('Adobe Inc.');
		expect(out.AppName).toBe(' Reader ');
	});

	it('lässt Nicht-Objekte unverändert', () => {
		expect(applyVendorSanitizeToFormData(null, ['AppVendor'])).toBe(null);
		expect(applyVendorSanitizeToFormData([], ['AppVendor'])).toEqual([]);
	});
});
