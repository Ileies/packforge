import { describe, expect, it } from 'vitest';

import {
	API_KEY_PREFIX_DISPLAY_LEN,
	generatePlaintextApiKey,
	hashApiKeyPlaintext,
	keyPrefixForDisplay
} from './api-key-crypto';

describe('api-key-crypto', () => {
	it('hash is stable hex sha256', () => {
		expect(hashApiKeyPlaintext('pf_test')).toBe(hashApiKeyPlaintext('pf_test'));
		expect(hashApiKeyPlaintext('pf_test')).toMatch(/^[a-f0-9]{64}$/);
	});

	it('generated keys have prefix and length', () => {
		const k = generatePlaintextApiKey();
		expect(k.startsWith('pf_')).toBe(true);
		expect(k.length).toBeGreaterThan(20);
	});

	it('prefix is bounded', () => {
		const long = 'pf_' + 'x'.repeat(40);
		expect(keyPrefixForDisplay(long).length).toBe(API_KEY_PREFIX_DISPLAY_LEN);
	});
});
