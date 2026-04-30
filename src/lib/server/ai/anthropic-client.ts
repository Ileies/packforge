import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages';

import { env } from '$env/dynamic/private';

import { loadDecryptedAnthropicKey, persistEncryptedAnthropicKey } from './ai-provider-key-settings';

let key = '';
let client: Anthropic | null = null;
let bootstrapped = false;

/** Einmal pro Worker: `ANTHROPIC_API_KEY` schlägt verschlüsselten Wert in `system_settings`. */
export function bootstrapAnthropicKeyIfNeeded(): void {
	if (bootstrapped) return;
	bootstrapped = true;
	const envKey = (env.ANTHROPIC_API_KEY || '').trim();
	if (envKey) {
		key = envKey;
		return;
	}
	const fromDb = loadDecryptedAnthropicKey();
	if (fromDb) key = fromDb;
}

export function setAnthropicApiKey(k: string) {
	key = k.trim();
	client = null;
	if (key) persistEncryptedAnthropicKey(key);
}

export function getAnthropicMasked(): string | null {
	bootstrapAnthropicKeyIfNeeded();
	return key ? `***${key.slice(-4)}` : null;
}

function getClient(): Anthropic {
	bootstrapAnthropicKeyIfNeeded();
	if (!key) throw new Error('Anthropic-API-Schlüssel ist nicht konfiguriert');
	if (!client) client = new Anthropic({ apiKey: key, timeout: 600_000 });
	return client;
}

export async function anthropicMessagesCreate(body: MessageCreateParamsNonStreaming) {
	return getClient().messages.create(body);
}

export async function anthropicTestConnection() {
	try {
		await getClient().messages.create({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 1,
			messages: [{ role: 'user', content: 'ping' }]
		});
		return { success: true, message: 'Verbindung erfolgreich' };
	} catch (e) {
		const err = e as { message?: string; code?: string };
		return { success: false, message: err.message ?? 'Error', code: err.code ?? 'UNKNOWN' };
	}
}
