import { getPrompt } from '../prompts';
import { createAiResponse } from './model-selector';

const IMPROVE_SCHEMA = {
	name: 'script_improvement',
	schema: {
		type: 'object',
		properties: {
			lineNumber: { type: 'number' },
			action: { type: 'string', enum: ['insert_after', 'insert_at', 'replace'] },
			code: { type: 'string' },
			explanation: { type: 'string' }
		},
		required: ['lineNumber', 'action', 'code', 'explanation'],
		additionalProperties: false
	}
};

const FIX_SCHEMA = {
	name: 'script_issues',
	schema: {
		type: 'object',
		properties: {
			issues: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						lineNumber: { type: 'number' },
						problem: { type: 'string' },
						solution: { type: 'string' }
					},
					required: ['lineNumber', 'problem', 'solution'],
					additionalProperties: false
				}
			}
		},
		required: ['issues'],
		additionalProperties: false
	}
};

function extractText(response: { output?: Array<{ type?: string; content?: Array<{ text?: string }> }> }) {
	const message = response.output?.find((item) => item.type === 'message');
	return message?.content?.[0]?.text ?? null;
}

export async function improveScript(
	scriptContent: string,
	userRequest: string,
	promptId: string | null,
	promptVersion: string | null
) {
	const lines = scriptContent.split('\n');
	const numberedScript = lines.map((line, index) => `${index + 1}| ${line}`).join('\n');
	const instructions = getPrompt('script-optimization');
	if (!instructions) throw new Error('Skript-Optimierungs-Prompt konnte nicht geladen werden');
	const userInput = `[ORIGINAL SCRIPT] with line numbers:
${numberedScript}
[USER REQUEST] ${userRequest}
Respond with JSON only.`;
	const response = await createAiResponse(
		userInput,
		instructions,
		null,
		promptId,
		promptVersion || '3',
		IMPROVE_SCHEMA
	);
	return { text: extractText(response as Parameters<typeof extractText>[0]), fullResponse: response };
}

export async function fixScriptIssue(
	scriptContent: string,
	issueDescription: string,
	promptId: string | null,
	promptVersion: string | null
) {
	const lines = scriptContent.split('\n');
	const numberedScript = lines.map((line, index) => `${index + 1}| ${line}`).join('\n');
	const instructions = getPrompt('script-fix');
	if (!instructions) throw new Error('Skript-Fix-Prompt konnte nicht geladen werden');
	const userInput = `Script with line numbers:
${numberedScript}

Issue Description: ${issueDescription}

Respond with JSON only.`;
	const response = await createAiResponse(
		userInput,
		instructions,
		null,
		promptId,
		promptVersion || '3',
		FIX_SCHEMA
	);
	return { text: extractText(response as Parameters<typeof extractText>[0]), fullResponse: response };
}
