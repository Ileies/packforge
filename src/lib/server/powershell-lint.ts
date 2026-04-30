import type { PowerShellLintProfile } from './powershell-lint-profile';

export type LintBaseSeverity = 'error' | 'warning' | 'info';

export type PowerShellLintFinding = {
	ruleId: string;
	severity: LintBaseSeverity;
	line: number;
	message: string;
};

type InternalRule = {
	id: string;
	base: LintBaseSeverity;
	test: (line: string) => string | null;
};

function isLineCommentOnly(trimmed: string): boolean {
	return trimmed.startsWith('#');
}

function includeInProfile(base: LintBaseSeverity, profile: PowerShellLintProfile): boolean {
	if (profile === 'strict') return true;
	return base === 'error';
}

const RULES: InternalRule[] = [
	{
		id: 'PF_PS_INVOKE_EXPRESSION',
		base: 'error',
		test: (line) => {
			if (/\bInvoke-Expression\b/i.test(line)) {
				return 'Invoke-Expression kann beliebigen Code ausführen — lieber gezielt aufrufen oder Daten strukturiert verarbeiten.';
			}
			if (/\bIEX\b/i.test(line)) {
				return 'Alias IEX (Invoke-Expression) — gleiches Risiko wie Invoke-Expression.';
			}
			return null;
		}
	},
	{
		id: 'PF_PS_PLAINTEXT_SECURESTRING',
		base: 'error',
		test: (line) => {
			if (/ConvertTo-SecureString\b/i.test(line) && /-AsPlainText\b/i.test(line)) {
				return 'ConvertTo-SecureString mit -AsPlainText: Klartext-Secrets im Skript vermeiden (z. B. Zertifikat/Secret Store).';
			}
			return null;
		}
	},
	{
		id: 'PF_PS_PASSWORD_LITERAL',
		base: 'error',
		test: (line) => {
			if (/-password\s+['"][^'"]{1,256}['"]/i.test(line)) {
				return 'Parameter -Password mit erkennbarem Klartext — Credentials nicht im Skript hinterlegen.';
			}
			return null;
		}
	},
	{
		id: 'PF_PS_WRITE_HOST',
		base: 'warning',
		test: (line) =>
			/\bWrite-Host\b/i.test(line)
				? 'Write-Host umgeht die normale Ausgabe-Pipeline — für Logging eher Write-Information / Write-Output prüfen.'
				: null
	},
	{
		id: 'PF_PS_CURL_WGET_ALIAS',
		base: 'warning',
		test: (line) => {
			if (/\bcurl\s/i.test(line)) {
				return 'curl ist in PowerShell oft ein Alias für Invoke-WebRequest — Lesbarkeit und Parameter mit Invoke-WebRequest explizit.';
			}
			if (/\bwget\s/i.test(line)) {
				return 'wget ist ein Alias — Invoke-WebRequest / Invoke-RestMethod bewusst einsetzen.';
			}
			return null;
		}
	},
	{
		id: 'PF_PS_GLOBAL_SCOPE',
		base: 'warning',
		test: (line) =>
			/\$global:/i.test(line)
				? '$global: verschmutzt den Sitzungszustand — möglichst script-/modullokal halten.'
				: null
	},
	{
		id: 'PF_PS_EMPTY_CATCH',
		base: 'warning',
		test: (line) =>
			/catch\s*\{\s*\}/.test(line)
				? 'Leerer catch-Block verschluckt Fehler — mindestens loggen oder erneut werfen.'
				: null
	},
	{
		id: 'PF_PS_USE_UNBLOCK_FILE',
		base: 'info',
		test: (line) =>
			/\bUnblock-File\b/i.test(line)
				? 'Unblock-File: bei aus dem Internet kopierten Dateien sinnvoll; Sicherheitsimplikationen bewusst prüfen.'
				: null
	},
	{
		id: 'PF_PS_START_PROCESS',
		base: 'info',
		test: (line) =>
			/\bStart-Process\b/i.test(line)
				? 'Start-Process: Argumente und WorkingDirectory prüfen, um unbeabsichtigte Aufrufe zu vermeiden.'
				: null
	}
];

/**
 * Heuristische PowerShell-Prüfung im Server (ohne PSScriptAnalyzer).
 * **locker:** nur `error`-Befunde; **streng:** zusätzlich `warning` und `info`.
 */
export function lintPowerShellScript(
	script: string,
	profile: PowerShellLintProfile
): PowerShellLintFinding[] {
	const lines = script.split(/\r?\n/);
	const out: PowerShellLintFinding[] = [];
	let lineNo = 0;
	for (const raw of lines) {
		lineNo += 1;
		const trimmed = raw.trim();
		if (!trimmed || isLineCommentOnly(trimmed)) continue;
		const line = raw;
		for (const rule of RULES) {
			if (!includeInProfile(rule.base, profile)) continue;
			const msg = rule.test(line);
			if (!msg) continue;
			out.push({ ruleId: rule.id, severity: rule.base, line: lineNo, message: msg });
		}
	}
	return out;
}
