import { env } from '$env/dynamic/private';

import { getSetting, setSetting } from '../repo/settings.repo';
import { decryptAiProviderKey, encryptAiProviderKey } from './ai-provider-key-crypto';

export const SETTING_OPENAI_API_KEY_ENC = 'openai_api_key_enc';
export const SETTING_ANTHROPIC_API_KEY_ENC = 'anthropic_api_key_enc';

function masterSecret(): string | null {
	const s = env.JWT_SECRET?.trim();
	return s && s.length > 0 ? s : null;
}

export function persistEncryptedOpenaiKey(plaintext: string): void {
	const ms = masterSecret();
	if (!ms) return;
	setSetting(SETTING_OPENAI_API_KEY_ENC, encryptAiProviderKey(plaintext, ms));
}

export function persistEncryptedAnthropicKey(plaintext: string): void {
	const ms = masterSecret();
	if (!ms) return;
	setSetting(SETTING_ANTHROPIC_API_KEY_ENC, encryptAiProviderKey(plaintext, ms));
}

export function loadDecryptedOpenaiKey(): string | null {
	const raw = getSetting(SETTING_OPENAI_API_KEY_ENC);
	if (!raw) return null;
	const ms = masterSecret();
	if (!ms) return null;
	return decryptAiProviderKey(raw, ms);
}

export function loadDecryptedAnthropicKey(): string | null {
	const raw = getSetting(SETTING_ANTHROPIC_API_KEY_ENC);
	if (!raw) return null;
	const ms = masterSecret();
	if (!ms) return null;
	return decryptAiProviderKey(raw, ms);
}
