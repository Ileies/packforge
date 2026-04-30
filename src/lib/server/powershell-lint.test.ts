import { describe, expect, it } from 'vitest';

import { lintPowerShellScript } from './powershell-lint';

describe('lintPowerShellScript', () => {
	it('lockeres Profil meldet nur Fehler-Schwere (z. B. Invoke-Expression)', () => {
		const script = "Write-Host 'hi'\nInvoke-Expression $x\n";
		const r = lintPowerShellScript(script, 'relaxed');
		expect(r.some((x) => x.ruleId === 'PF_PS_INVOKE_EXPRESSION')).toBe(true);
		expect(r.some((x) => x.ruleId === 'PF_PS_WRITE_HOST')).toBe(false);
	});

	it('strenges Profil enthält Write-Host', () => {
		const script = "Write-Host 'hi'\n";
		const r = lintPowerShellScript(script, 'strict');
		expect(r.some((x) => x.ruleId === 'PF_PS_WRITE_HOST')).toBe(true);
	});

	it('ignoriert reine Kommentarzeilen für Stilregeln', () => {
		const script = '# Write-Host x\n';
		const strict = lintPowerShellScript(script, 'strict');
		expect(strict.some((x) => x.ruleId === 'PF_PS_WRITE_HOST')).toBe(false);
	});

	it('ConvertTo-SecureString -AsPlainText ist immer ein Treffer', () => {
		const script = '$s = ConvertTo-SecureString "x" -AsPlainText -Force\n';
		expect(lintPowerShellScript(script, 'relaxed').length).toBeGreaterThan(0);
	});
});
