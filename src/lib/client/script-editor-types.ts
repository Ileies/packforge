/** Software-Eintrag (Liste / Auswahl). */
export type SoftwareSummary = {
	id: number;
	name: string;
	version: string | null;
	file_name: string;
};

export type CheckpointRow = {
	checkpoint_number: number;
	name: string | null;
	comment: string | null;
	created_at: string | null;
};

export type LintFinding = { ruleId: string; severity: string; line: number; message: string };

export type PssaFinding = {
	line: number;
	column: number;
	ruleName: string;
	severity: string;
	message: string;
};

export type PssaPayload =
	| { status: 'ran'; findings: PssaFinding[] }
	| { status: 'skipped'; reason: string }
	| { status: 'unavailable'; reason: string };

export type PendingAi = { kind: 'improve' | 'fix'; text: string; scriptAnalyzer?: PssaPayload };

export type SoftwareDetailRow = {
	name?: unknown;
	version?: unknown;
	generated_script?: unknown;
	form_data?: unknown;
};
