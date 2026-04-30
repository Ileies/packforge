import { getPrompt } from '../prompts';
import { createAiResponse } from './model-selector';

export async function enrichUserRequest(
	userRequest: string,
	metadata: { softwareName?: string; softwareVersion?: string; formData?: unknown }
) {
	try {
		const prompt = getPrompt('enrichment');
		if (!prompt) throw new Error('Enrichment-Prompt konnte nicht geladen werden');
		let contextString = userRequest;
		if (metadata.softwareName || metadata.softwareVersion) {
			contextString += '\n\nSoftware Context:\n';
			if (metadata.softwareName) contextString += `- Name: ${metadata.softwareName}\n`;
			if (metadata.softwareVersion) contextString += `- Version: ${metadata.softwareVersion}\n`;
		}
		const response = await createAiResponse(contextString, prompt, 'gpt-5-mini', null, '3', null);
		const out = response as {
			output?: Array<{ type?: string; content?: Array<{ text?: string }> }>;
		};
		const message = out.output?.find((item) => item.type === 'message');
		const text = message?.content?.[0]?.text || '';
		return { success: true as const, enrichmentData: text, model: 'gpt-5-mini' };
	} catch (e) {
		const err = e instanceof Error ? e.message : 'Fehler';
		return { success: false as const, error: err, enrichmentData: null };
	}
}
