import OpenAI from 'openai';
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses.js';

import { env } from '$env/dynamic/private';

import { loadDecryptedOpenaiKey, persistEncryptedOpenaiKey } from './ai-provider-key-settings';

let key = '';
let client: OpenAI | null = null;
let bootstrapped = false;

/** Einmal pro Worker: `OPENAI_API_KEY` schlägt verschlüsselten Wert in `system_settings`. */
export function bootstrapOpenaiKeyIfNeeded(): void {
	if (bootstrapped) return;
	bootstrapped = true;
	const envKey = (env.OPENAI_API_KEY || '').trim();
	if (envKey) {
		key = envKey;
		return;
	}
	const fromDb = loadDecryptedOpenaiKey();
	if (fromDb) key = fromDb;
}

export function setOpenaiApiKey(k: string) {
	key = k.trim();
	client = null;
	if (key) persistEncryptedOpenaiKey(key);
}

export function getOpenaiMasked(): string | null {
	bootstrapOpenaiKeyIfNeeded();
	return key ? `***${key.slice(-4)}` : null;
}

function getClient(): OpenAI {
	bootstrapOpenaiKeyIfNeeded();
	if (!key) throw new Error('OpenAI-API-Schlüssel ist nicht konfiguriert');
	if (!client) client = new OpenAI({ apiKey: key, timeout: 600_000 });
	return client;
}

export async function openaiCreateResponse(body: ResponseCreateParamsNonStreaming) {
	return getClient().responses.create(body);
}

export async function openaiTestConnection() {
	try {
		await getClient().models.list();
		return { success: true, message: 'Verbindung erfolgreich' };
	} catch (e) {
		const err = e as { message?: string; code?: string };
		return { success: false, message: err.message ?? 'Error', code: err.code ?? 'UNKNOWN' };
	}
}
