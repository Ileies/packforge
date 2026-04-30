export const AI_PROVIDERS = ['openai', 'anthropic'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export function isAiProvider(v: string | null | undefined): v is AiProvider {
	return v != null && (AI_PROVIDERS as readonly string[]).includes(v);
}
