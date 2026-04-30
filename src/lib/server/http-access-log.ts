import { env } from '$env/dynamic/private';
import { appLog } from '$lib/server/app-log';
import { appendStructuredJsonLine, mirrorStructuredLogsToStdout } from '$lib/server/json-line-file-log';

export type HttpAccessLogEntry = {
	ts: string;
	level: 'info';
	type: 'http_access';
	traceId: string;
	method: string;
	path: string;
	route: string | null;
	status: number;
	durationMs: number;
	userId: string | null;
	tenantId: string | null;
};

/** JSON-Zeile: stdout (optional) + Datei unter `DATA_ROOT/logs`, sofern `LOG_FILE_ENABLED` nicht aus. Per `LOG_HTTP_ACCESS=0` abschaltbar. */
export function writeHttpAccessLog(fields: {
	traceId: string;
	method: string;
	path: string;
	route: string | null;
	status: number;
	durationMs: number;
	userId: string | null;
	tenantId?: string | null;
}): void {
	const off = env.LOG_HTTP_ACCESS === 'false' || env.LOG_HTTP_ACCESS === '0';
	if (off) return;

	const entry: HttpAccessLogEntry = {
		ts: new Date().toISOString(),
		level: 'info',
		type: 'http_access',
		traceId: fields.traceId,
		method: fields.method,
		path: fields.path,
		route: fields.route,
		status: fields.status,
		durationMs: fields.durationMs,
		userId: fields.userId,
		tenantId: fields.tenantId ?? null
	};
	const line = JSON.stringify(entry);
	if (mirrorStructuredLogsToStdout()) appLog.info(line);
	appendStructuredJsonLine('http_access', line);
}
