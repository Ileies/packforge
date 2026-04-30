import { describe, expect, it } from 'vitest';

import { extractImproveCodeFromAiText } from './psscript-analyzer';

describe('extractImproveCodeFromAiText', () => {
	it('liest code aus gültigem JSON', () => {
		const j = JSON.stringify({
			lineNumber: 1,
			action: 'replace',
			code: 'Get-Process\n',
			explanation: 'x'
		});
		expect(extractImproveCodeFromAiText(j)).toBe('Get-Process\n');
	});

	it('findet JSON in eingebettetem Text', () => {
		const wrapped = `Here is the result:\n${JSON.stringify({
			lineNumber: 2,
			action: 'insert_at',
			code: '$x = 1',
			explanation: 'y'
		})}\n`;
		expect(extractImproveCodeFromAiText(wrapped)).toBe('$x = 1');
	});

	it('gibt null bei fehlendem code zurück', () => {
		expect(extractImproveCodeFromAiText('{"issues":[]}')).toBeNull();
		expect(extractImproveCodeFromAiText(null)).toBeNull();
		expect(extractImproveCodeFromAiText('')).toBeNull();
	});
});
