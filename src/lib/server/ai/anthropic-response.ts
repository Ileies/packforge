import type { ContentBlock, MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages';

import { anthropicMessagesCreate } from './anthropic-client';

export async function anthropicNormalizedResponse(
	prompt: string,
	instructions: string | null,
	model: string,
	promptId: string | null
) {
	const m = model || 'claude-haiku-4-5-20251001';
	const system: MessageCreateParamsNonStreaming['system'] = instructions
		? [{ type: 'text' as const, text: instructions, cache_control: { type: 'ephemeral' as const } }]
		: [];
	const messages: MessageCreateParamsNonStreaming['messages'] = [
		{
			role: 'user',
			content: promptId ? prompt || 'Bearbeite diese Anfrage.' : prompt
		}
	];
	const requestConfig = {
		model: m,
		max_tokens: 32000,
		thinking: { type: 'enabled' as const, budget_tokens: 16000 },
		system,
		messages
	} satisfies MessageCreateParamsNonStreaming;
	const response = await anthropicMessagesCreate(requestConfig);
	const cacheCreationInputTokens = response.usage?.cache_creation_input_tokens || 0;
	const cacheReadInputTokens = response.usage?.cache_read_input_tokens || 0;
	let thinkingContent = null;
	let textContent = response.content;
	if (response.content && Array.isArray(response.content)) {
		const blocks = response.content as ContentBlock[];
		thinkingContent = blocks.find((b) => b.type === 'thinking') ?? null;
		textContent = blocks.filter((b) => b.type !== 'thinking');
	}
	return {
		id: response.id,
		model: response.model,
		status: 'completed',
		created_at: Math.floor(Date.now() / 1000),
		service_tier: 'standard',
		output: [{ type: 'message', content: textContent }],
		thinking: thinkingContent,
		usage: {
			input_tokens: response.usage?.input_tokens || 0,
			output_tokens: response.usage?.output_tokens || 0,
			total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
			cache_creation_input_tokens: cacheCreationInputTokens,
			cache_read_input_tokens: cacheReadInputTokens,
			input_tokens_details: { cached_tokens: cacheReadInputTokens },
			output_tokens_details: { reasoning_tokens: 0 }
		}
	};
}
