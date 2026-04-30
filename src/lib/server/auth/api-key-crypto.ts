import { createHash, randomBytes } from 'node:crypto';

const PREFIX = 'pf_';

/** Öffentlicher Präfix für Anzeige in Listen (vollständiger Geheimnis-Teil bleibt nur bei Erstellung sichtbar). */
export const API_KEY_PREFIX_DISPLAY_LEN = 12;

export function generatePlaintextApiKey(): string {
	return `${PREFIX}${randomBytes(24).toString('base64url')}`;
}

export function hashApiKeyPlaintext(plaintext: string): string {
	return createHash('sha256').update(plaintext, 'utf8').digest('hex');
}

export function keyPrefixForDisplay(plaintext: string): string {
	const s = plaintext.trim();
	if (s.length <= API_KEY_PREFIX_DISPLAY_LEN) return s;
	return s.slice(0, API_KEY_PREFIX_DISPLAY_LEN);
}
