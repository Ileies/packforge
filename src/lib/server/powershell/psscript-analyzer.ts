import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { env } from '$env/dynamic/private';

const execFileAsync = promisify(execFile);

/** Max. Zeichen pro Snippet (PSSA-Lauf); getrennt von KI-Gesamtskript-Limit. */
export const MAX_PSSA_SNIPPET_CHARS = 512_000;

const PSSA_INVOKER_PS1 = `
param(
  [Parameter(Mandatory = $true)]
  [string] $SnippetPath,
  [Parameter(Mandatory = $false)]
  [string] $SeverityLevels = 'Error,Warning'
)
$ErrorActionPreference = 'Stop'
try {
  Import-Module PSScriptAnalyzer -ErrorAction Stop
} catch {
  (@{ ok = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress -Depth 4)
  exit 0
}
try {
  $snippet = [System.IO.File]::ReadAllText($SnippetPath, [System.Text.UTF8Encoding]::new($false))
  $sev = @($SeverityLevels -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  if ($sev.Count -eq 0) { $sev = @('Error') }
  $results = Invoke-ScriptAnalyzer -ScriptDefinition $snippet -Severity $sev -IncludeDefaultRules
  $findings = @(foreach ($r in $results) {
    @{
      line = [int]$r.Line
      column = [int]$r.Column
      ruleName = [string]$r.RuleName
      severity = [string]$r.Severity
      message = [string]$r.Message
    }
  })
  (@{ ok = $true; findings = $findings } | ConvertTo-Json -Compress -Depth 10)
} catch {
  (@{ ok = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress -Depth 4)
  exit 0
}
`.trim();

export type PssaFinding = {
	line: number;
	column: number;
	ruleName: string;
	severity: string;
	message: string;
};

export type PssaAnalyzeResult =
	| { status: 'ran'; findings: PssaFinding[] }
	| { status: 'skipped'; reason: string }
	| { status: 'unavailable'; reason: string };

function stripBom(s: string) {
	return s.replace(/^\uFEFF/, '').trim();
}

/**
 * Nur `pwsh`/`powershell` (optional .exe) oder ein absoluter Pfad, der darauf endet — keine Shell-Metazeichen,
 * kein `..` (Command-Injection über PACKFORGE_PWSH vermeiden).
 */
function resolvePwsh(): string {
	const raw = env.PACKFORGE_PWSH?.trim();
	if (!raw) return 'pwsh';
	if (/[\n\r;&|`$()<>]/.test(raw) || raw.includes('..')) return 'pwsh';
	const norm = raw.replace(/\\/g, '/');
	const base = norm.split('/').pop() ?? norm;
	const shortOk = ['pwsh', 'pwsh.exe', 'powershell', 'powershell.exe'].includes(base);
	const absOk =
		(norm.startsWith('/') || /^[A-Za-z]:\//.test(norm)) && /\/(pwsh|powershell)(\.exe)?$/i.test(norm);
	if (shortOk || absOk) return raw;
	return 'pwsh';
}

/**
 * Führt PSScriptAnalyzer per `pwsh` auf einem Skript-Fragment aus (Invoke-ScriptAnalyzer -ScriptDefinition).
 * Fehlt PowerShell, das Modul oder die Ausführung schlägt fehl → `unavailable` / `skipped`, kein Throw.
 */
export type PssaLintProfile = 'relaxed' | 'strict';

/** Locker: nur PSSA-Severity **Error**; streng: **Error** und **Warning**. */
export function pssaSeverityLevelsArg(profile: PssaLintProfile): string {
	return profile === 'relaxed' ? 'Error' : 'Error,Warning';
}

export async function analyzePowerShellSnippet(
	snippet: string,
	opts?: { profile?: PssaLintProfile }
): Promise<PssaAnalyzeResult> {
	if (env.PACKFORGE_DISABLE_PSSA === '1' || env.PACKFORGE_DISABLE_PSSA === 'true') {
		return { status: 'skipped', reason: 'PSScriptAnalyzer per PACKFORGE_DISABLE_PSSA deaktiviert.' };
	}
	const trimmed = snippet.trim();
	if (!trimmed) return { status: 'skipped', reason: 'Leeres Snippet.' };
	if (trimmed.length > MAX_PSSA_SNIPPET_CHARS) {
		return {
			status: 'skipped',
			reason: `Snippet überschreitet ${MAX_PSSA_SNIPPET_CHARS.toLocaleString('de-DE')} Zeichen.`
		};
	}

	const pwsh = resolvePwsh();
	const dir = await mkdtemp(join(tmpdir(), 'pssa-'));
	const snippetPath = join(dir, 'snippet.ps1');
	const invokerPath = join(dir, 'invoke-pssa.ps1');
	try {
		await writeFile(snippetPath, trimmed, 'utf8');
		await writeFile(invokerPath, PSSA_INVOKER_PS1, 'utf8');
		const profile = opts?.profile ?? 'strict';
		const { stdout, stderr } = await execFileAsync(
			pwsh,
			[
				'-NoProfile',
				'-NonInteractive',
				'-File',
				invokerPath,
				'-SnippetPath',
				snippetPath,
				'-SeverityLevels',
				pssaSeverityLevelsArg(profile)
			],
			{
				encoding: 'utf8',
				maxBuffer: 12 * 1024 * 1024,
				timeout: 45_000,
				windowsHide: true
			}
		);
		const raw = stripBom(stdout);
		if (!raw) {
			return {
				status: 'unavailable',
				reason: stderr?.trim() ? stderr.trim() : 'Keine PSSA-Ausgabe (leeres stdout).'
			};
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return { status: 'unavailable', reason: 'PSSA-Antwort war kein gültiges JSON.' };
		}
		if (!parsed || typeof parsed !== 'object') {
			return { status: 'unavailable', reason: 'PSSA-Antwort: unerwartetes Format.' };
		}
		const o = parsed as { ok?: boolean; error?: string; findings?: unknown };
		if (o.ok === false) {
			return {
				status: 'unavailable',
				reason: typeof o.error === 'string' ? o.error : 'PSScriptAnalyzer-Modul oder Aufruf fehlgeschlagen.'
			};
		}
		if (o.ok !== true) {
			return { status: 'unavailable', reason: 'PSSA-Antwort ohne ok=true.' };
		}
		const findingsRaw = o.findings;
		if (!Array.isArray(findingsRaw)) {
			return { status: 'ran', findings: [] };
		}
		const findings: PssaFinding[] = [];
		for (const row of findingsRaw) {
			if (!row || typeof row !== 'object') continue;
			const r = row as Record<string, unknown>;
			findings.push({
				line: typeof r.line === 'number' ? r.line : Number(r.line) || 0,
				column: typeof r.column === 'number' ? r.column : Number(r.column) || 0,
				ruleName: String(r.ruleName ?? ''),
				severity: String(r.severity ?? ''),
				message: String(r.message ?? '')
			});
		}
		return { status: 'ran', findings };
	} catch (e) {
		const err = e as { code?: string; message?: string };
		if (err.code === 'ENOENT') {
			return {
				status: 'unavailable',
				reason: `PowerShell nicht gefunden (${pwsh}). PACKFORGE_PWSH setzen oder pwsh installieren.`
			};
		}
		if (err.code === 'ETIMEDOUT') {
			return { status: 'unavailable', reason: 'PSScriptAnalyzer-Timeout (45s).' };
		}
		return { status: 'unavailable', reason: err.message ?? String(e) };
	} finally {
		await rm(dir, { recursive: true, force: true }).catch(() => undefined);
	}
}

/** Erwartet JSON der KI-Verbesserung mit Feld `code` (siehe script-optimization). */
export function extractImproveCodeFromAiText(text: string | null | undefined): string | null {
	if (text == null || !String(text).trim()) return null;
	const raw = String(text).trim();
	try {
		const j = JSON.parse(raw) as { code?: unknown };
		if (typeof j.code === 'string' && j.code.trim()) return j.code;
	} catch {
		const start = raw.indexOf('{');
		const end = raw.lastIndexOf('}');
		if (start >= 0 && end > start) {
			try {
				const j = JSON.parse(raw.slice(start, end + 1)) as { code?: unknown };
				if (typeof j.code === 'string' && j.code.trim()) return j.code;
			} catch {
				/* ignore */
			}
		}
	}
	return null;
}

export async function analyzeImproveAiOutputText(
	aiText: string | null | undefined,
	profile?: PssaLintProfile
): Promise<PssaAnalyzeResult> {
	const code = extractImproveCodeFromAiText(aiText);
	if (!code) {
		return {
			status: 'skipped',
			reason: 'Kein parsebares code-Feld in der KI-Antwort (z. B. Anthropic ohne JSON-Schema).'
		};
	}
	return analyzePowerShellSnippet(code, { profile });
}
