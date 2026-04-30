import fs from 'node:fs';
import path from 'node:path';

import { env } from '$env/dynamic/private';
import { appLog } from '$lib/server/app-log';
import { resolveDataRoot } from '$lib/server/paths-core';

export type StructuredLogStream = 'http_access' | 'audit';

const ACTIVE_FILE: Record<StructuredLogStream, string> = {
	http_access: 'http-access.log',
	audit: 'audit.log'
};

const ROTATED_RE: Record<StructuredLogStream, RegExp> = {
	http_access: /^http-access\.(\d+)\.log$/,
	audit: /^audit\.(\d+)\.log$/
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
	if (raw === undefined || raw === '') return fallback;
	const n = Number.parseInt(String(raw).trim(), 10);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Wenn Dateiausgabe aktiv ist: zusätzlich stdout (Standard ja). */
export function mirrorStructuredLogsToStdout(): boolean {
	if (!effectiveLogDir()) return true;
	const v = env.LOG_STDOUT;
	return v !== '0' && v !== 'false';
}

/** Zielverzeichnis oder `null`, wenn Dateilog aus ist. */
export function effectiveLogDir(): string | null {
	const off = env.LOG_FILE_ENABLED === '0' || env.LOG_FILE_ENABLED === 'false';
	if (off) return null;
	const explicit = env.LOG_DIR?.trim();
	if (explicit) return path.resolve(explicit);
	const root = resolveDataRoot(process.cwd(), env.DATA_ROOT ?? null);
	return path.resolve(root, 'logs');
}

let lastRetentionAt = 0;
let writesSinceRetention = 0;

const RETENTION_MIN_INTERVAL_MS = 60 * 60 * 1000;
const RETENTION_EVERY_N_WRITES = 500;

function logMaxBytes(): number {
	return parsePositiveInt(env.LOG_MAX_BYTES, 50 * 1024 * 1024);
}

function retentionDaysHttp(): number {
	return parsePositiveInt(env.LOG_RETENTION_DAYS_HTTP, 90);
}

function retentionDaysAudit(): number {
	return parsePositiveInt(env.LOG_RETENTION_DAYS_AUDIT, 365);
}

function rotateIfNeeded(stream: StructuredLogStream, filePath: string): void {
	const max = logMaxBytes();
	let st: fs.Stats;
	try {
		st = fs.statSync(filePath);
	} catch {
		return;
	}
	if (st.size <= max) return;
	const dir = path.dirname(filePath);
	const dest = path.join(dir, `${stream === 'http_access' ? 'http-access' : 'audit'}.${Date.now()}.log`);
	try {
		fs.renameSync(filePath, dest);
	} catch (e) {
		appLog.error('log rotate:', e);
	}
}

function runRetentionOnDir(absDir: string): void {
	const now = Date.now();
	const httpMs = retentionDaysHttp() * 24 * 60 * 60 * 1000;
	const auditMs = retentionDaysAudit() * 24 * 60 * 60 * 1000;
	let names: string[];
	try {
		names = fs.readdirSync(absDir);
	} catch {
		return;
	}
	for (const name of names) {
		const full = path.join(absDir, name);
		let st: fs.Stats;
		try {
			st = fs.statSync(full);
		} catch {
			continue;
		}
		if (!st.isFile()) continue;
		if (ROTATED_RE.http_access.test(name)) {
			if (now - st.mtimeMs > httpMs) fs.unlinkSync(full);
		} else if (ROTATED_RE.audit.test(name)) {
			if (now - st.mtimeMs > auditMs) fs.unlinkSync(full);
		}
	}
}

function maybeRunRetention(absDir: string): void {
	writesSinceRetention += 1;
	const t = Date.now();
	if (
		t - lastRetentionAt < RETENTION_MIN_INTERVAL_MS &&
		writesSinceRetention % RETENTION_EVERY_N_WRITES !== 0
	) {
		return;
	}
	lastRetentionAt = t;
	runRetentionOnDir(absDir);
}

/** Eine JSON-Zeile an die aktive Logdatei anhängen; Rotation und Retention optional. */
export function appendStructuredJsonLine(stream: StructuredLogStream, jsonLine: string): void {
	const dir = effectiveLogDir();
	if (!dir) return;
	try {
		fs.mkdirSync(dir, { recursive: true });
		const filePath = path.join(dir, ACTIVE_FILE[stream]);
		fs.appendFileSync(filePath, `${jsonLine}\n`, 'utf8');
		rotateIfNeeded(stream, filePath);
		maybeRunRetention(dir);
	} catch (e) {
		appLog.error('json-line-file-log:', e);
	}
}

/** Nur unter Vitest: Retention sofort ausführen (z. B. nach künstlich alter Datei). */
export function __test_runRetentionNow(absDir: string): void {
	if (process.env.VITEST !== 'true') return;
	runRetentionOnDir(absDir);
}
