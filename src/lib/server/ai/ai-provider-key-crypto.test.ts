import { describe, expect, it } from 'vitest';

import { decryptAiProviderKey, encryptAiProviderKey } from './ai-provider-key-crypto';

describe('ai-provider-key-crypto', () => {
	const secret = 'x'.repeat(32);

	it('roundtrips ASCII API key material', () => {
		const plain = 'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789';
		const enc = encryptAiProviderKey(plain, secret);
		expect(enc.startsWith('pf1:')).toBe(true);
		expect(decryptAiProviderKey(enc, secret)).toBe(plain);
	});

	it('returns null for wrong secret', () => {
		const enc = encryptAiProviderKey('sk-ant-api03-secretvalue', secret);
		expect(decryptAiProviderKey(enc, 'y'.repeat(32))).toBeNull();
	});

	it('returns null for invalid payload', () => {
		expect(decryptAiProviderKey('pf1:not-valid-base64url!!!', secret)).toBeNull();
		expect(decryptAiProviderKey('legacy-plaintext', secret)).toBeNull();
	});
});
