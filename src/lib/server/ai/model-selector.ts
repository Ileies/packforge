import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses.js';

import type { AiProvider } from '$lib/app/ai-providers';
import { AI_PROVIDERS, isAiProvider } from '$lib/app/ai-providers';

import { getSetting, setSetting } from '../repo/settings.repo';
import {
	anthropicTestConnection,
	bootstrapAnthropicKeyIfNeeded,
	getAnthropicMasked,
	setAnthropicApiKey
} from './anthropic-client';
import { anthropicNormalizedResponse } from './anthropic-response';
import {
	bootstrapOpenaiKeyIfNeeded,
	getOpenaiMasked,
	openaiCreateResponse,
	openaiTestConnection,
	setOpenaiApiKey
} from './openai-client';

/**
 * Aktives KI-Modell: Quelle ist immer `system_settings.active_ai_model` (kein veralteter RAM-Cache),
 * damit mehrere Worker dieselbe SQLite-Instanz konsistent sehen und Änderungen ohne Prozess-Neustart greifen.
 *
 * API-Schlüssel: einmaliges Bootstrap pro Worker (`bootstrap*KeyIfNeeded`) — Env schlägt verschlüsselte DB;
 * in der UI gesetzte Schlüssel liegen in `system_settings`.
 */
let keysBootstrapped = false;

/** OpenAI structured output: Name + JSON-Schema-Objekt für `text.format`. */
export type AiJsonSchemaFormat = { name: string; schema: Record<string, unknown> };

function ensureKeysBootstrapped() {
	if (keysBootstrapped) return;
	keysBootstrapped = true;
	bootstrapOpenaiKeyIfNeeded();
	bootstrapAnthropicKeyIfNeeded();
}

function readActiveModelFromDb(): AiProvider {
	const v = getSetting('active_ai_model');
	return isAiProvider(v) ? v : 'openai';
}

export function getActiveModel(): AiProvider {
	ensureKeysBootstrapped();
	return readActiveModelFromDb();
}

export function setActiveModel(model: string) {
	if (!isAiProvider(model)) {
		throw new Error(`Ungültiges Modell. Erlaubt: ${AI_PROVIDERS.join(', ')}`);
	}
	setSetting('active_ai_model', model);
}

/** Key für den jeweils aktiven Anbieter (wie Legacy-Express). */
export function setApiKeyForActiveProvider(apiKey: string) {
	setApiKeyForProvider(getActiveModel(), apiKey);
}

/** Key explizit setzen — unabhängig vom aktiven Modell (UI sendet gewählten Anbieter). */
export function setApiKeyForProvider(provider: AiProvider, apiKey: string) {
	ensureKeysBootstrapped();
	if (provider === 'anthropic') setAnthropicApiKey(apiKey);
	else setOpenaiApiKey(apiKey);
}

export function getMaskedApiKeyForActive() {
	ensureKeysBootstrapped();
	return getActiveModel() === 'anthropic' ? getAnthropicMasked() : getOpenaiMasked();
}

/** Maskierte API-Schlüssel beider Anbieter + aktives Modell (für Einstellungs-UI). */
export function getMaskedApiKeyOverview() {
	ensureKeysBootstrapped();
	return {
		activeModel: getActiveModel(),
		apiKey: getMaskedApiKeyForActive(),
		openaiMasked: getOpenaiMasked(),
		anthropicMasked: getAnthropicMasked()
	};
}

function buildOpenAiResponsesParams(
	prompt: string,
	instructions: string | null,
	model: string | null,
	promptId: string | null,
	promptVersion: string,
	jsonSchema: AiJsonSchemaFormat | null
): ResponseCreateParamsNonStreaming {
	const reasoning = { effort: 'medium' as const };
	let text: ResponseCreateParamsNonStreaming['text'] = { verbosity: 'low' };
	if (jsonSchema) {
		text = {
			verbosity: 'low',
			format: {
				type: 'json_schema',
				name: jsonSchema.name,
				strict: true,
				schema: jsonSchema.schema as never
			}
		};
	}

	return (
		promptId
			? {
					model: model || 'gpt-5-mini',
					service_tier: 'priority' as const,
					prompt: { id: promptId, version: promptVersion || '3' },
					input: prompt,
					reasoning,
					text
				}
			: {
					model: model || 'gpt-5-mini',
					service_tier: 'priority' as const,
					input: prompt,
					instructions: instructions ?? undefined,
					reasoning,
					text
				}
	) as ResponseCreateParamsNonStreaming;
}

export async function createAiResponse(
	prompt: string,
	instructions: string | null,
	model: string | null,
	promptId: string | null,
	promptVersion: string,
	jsonSchema: AiJsonSchemaFormat | null
) {
	ensureKeysBootstrapped();
	if (getActiveModel() === 'anthropic') {
		return anthropicNormalizedResponse(prompt, instructions, model || 'claude-haiku-4-5-20251001', promptId);
	}
	return openaiCreateResponse(
		buildOpenAiResponsesParams(prompt, instructions, model, promptId, promptVersion, jsonSchema)
	);
}

export async function testActiveAiConnection() {
	ensureKeysBootstrapped();
	return getActiveModel() === 'anthropic' ? anthropicTestConnection() : openaiTestConnection();
}
