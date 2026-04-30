import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const PREFIX = 'pf1:';
const SCRYPT_SALT = 'packforge-ai-provider-api-key';

function deriveKey(jwtSecret: string): Buffer {
	return scryptSync(jwtSecret, SCRYPT_SALT, 32);
}

/** Authentifizierte Verschlüsselung für at-rest KI-Anbieter-Keys (hängt an `JWT_SECRET`). */
export function encryptAiProviderKey(plaintext: string, jwtSecret: string): string {
	const key = deriveKey(jwtSecret);
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function decryptAiProviderKey(payload: string, jwtSecret: string): string | null {
	if (!payload.startsWith(PREFIX)) return null;
	try {
		const raw = Buffer.from(payload.slice(PREFIX.length), 'base64url');
		if (raw.length < 12 + 16) return null;
		const iv = raw.subarray(0, 12);
		const tag = raw.subarray(12, 28);
		const enc = raw.subarray(28);
		const decipher = createDecipheriv('aes-256-gcm', deriveKey(jwtSecret), iv);
		decipher.setAuthTag(tag);
		return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
	} catch {
		return null;
	}
}
