import { appLog } from '$lib/server/app-log';
import { appendStructuredJsonLine, mirrorStructuredLogsToStdout } from '$lib/server/json-line-file-log';

export type AuditAction = 'psadt_export' | 'instance_export';

export type AuditLogFields = {
	action: AuditAction;
	userId: string | null;
	traceId: string;
	detail?: Record<string, unknown>;
};

/** JSON-Zeile: stdout (optional) + Datei — nicht für PII; korreliert mit HTTP-Access über `traceId`. */
export function writeAuditLog(fields: AuditLogFields): void {
	const entry = {
		ts: new Date().toISOString(),
		level: 'info' as const,
		type: 'audit' as const,
		action: fields.action,
		userId: fields.userId,
		traceId: fields.traceId,
		...(fields.detail ? { detail: fields.detail } : {})
	};
	const line = JSON.stringify(entry);
	if (mirrorStructuredLogsToStdout()) appLog.info(line);
	appendStructuredJsonLine('audit', line);
}
