import { and, desc, eq, isNull } from 'drizzle-orm';

import { generatePlaintextApiKey, hashApiKeyPlaintext, keyPrefixForDisplay } from '../auth/api-key-crypto';
import type { ApiKeyScope } from '../auth/api-key-scopes';
import { normalizeApiKeyScopes, scopesFromJson, scopesToJson } from '../auth/api-key-scopes';
import { getMainDb } from '../db/main-db';
import { sqliteRunResult } from '../db/sqlite-run-result';
import { apiKeys } from '../schema/main-schema';

export type ApiKeyRow = typeof apiKeys.$inferSelect;

export type ApiKeySummary = {
	id: number;
	key_prefix: string;
	label: string | null;
	expires_at: string | null;
	scopes: ApiKeyScope[];
	created_at: string | null;
	revoked_at: string | null;
	last_used_at: string | null;
};

function rowToSummary(r: ApiKeyRow): ApiKeySummary {
	return {
		id: r.id,
		key_prefix: r.key_prefix,
		label: r.label,
		expires_at: r.expires_at,
		scopes: scopesFromJson(r.scopes_json),
		created_at: r.created_at,
		revoked_at: r.revoked_at,
		last_used_at: r.last_used_at
	};
}

export type CreateApiKeyInput = {
	label?: string | null;
	expiresAt?: Date | null;
	scopes: ApiKeyScope[];
};

export type CreateApiKeyResult = {
	id: number;
	plaintext: string;
	summary: ApiKeySummary;
};

/**
 * Legt einen API-Schlüssel an. `plaintext` nur einmal an den Aufrufer zurückgeben — nicht loggen.
 */
export function createApiKey(input: CreateApiKeyInput): CreateApiKeyResult {
	const db = getMainDb();
	const scopes = normalizeApiKeyScopes(input.scopes);
	const plaintext = generatePlaintextApiKey();
	const key_hash = hashApiKeyPlaintext(plaintext);
	const key_prefix = keyPrefixForDisplay(plaintext);
	const expires_at = input.expiresAt != null ? input.expiresAt.toISOString() : null;
	const label = input.label?.trim() ? input.label.trim() : null;

	const inserted = db
		.insert(apiKeys)
		.values({
			key_hash,
			key_prefix,
			label,
			expires_at,
			scopes_json: scopesToJson(scopes)
		})
		.returning()
		.get();

	if (!inserted) {
		throw new Error('API-Schlüssel konnte nicht angelegt werden');
	}

	return {
		id: inserted.id,
		plaintext,
		summary: rowToSummary(inserted)
	};
}

/** Alle API-Schlüssel (aktiv und widerrufen), neueste zuerst — für Admin-UI / Rotation. */
export function listApiKeys(): ApiKeySummary[] {
	const rows = getMainDb()
		.select({
			id: apiKeys.id,
			key_hash: apiKeys.key_hash,
			key_prefix: apiKeys.key_prefix,
			label: apiKeys.label,
			expires_at: apiKeys.expires_at,
			scopes_json: apiKeys.scopes_json,
			created_at: apiKeys.created_at,
			revoked_at: apiKeys.revoked_at,
			last_used_at: apiKeys.last_used_at
		})
		.from(apiKeys)
		.orderBy(desc(apiKeys.id))
		.all();
	return rows.map(rowToSummary);
}

/** Widerruft einen Key (soft). */
export function revokeApiKey(id: number): boolean {
	const db = getMainDb();
	const r = sqliteRunResult(
		db
			.update(apiKeys)
			.set({ revoked_at: new Date().toISOString() })
			.where(and(eq(apiKeys.id, id), isNull(apiKeys.revoked_at)))
			.run()
	);
	return (r.changes ?? 0) > 0;
}

/**
 * Sucht einen nicht widerrufenen, nicht abgelaufenen Key nach Klartext (für künftige Bearer-Auth).
 */
export function findActiveApiKeyByPlaintext(plaintext: string): ApiKeyRow | undefined {
	const hash = hashApiKeyPlaintext(plaintext.trim());
	const row = getMainDb()
		.select({
			id: apiKeys.id,
			key_hash: apiKeys.key_hash,
			key_prefix: apiKeys.key_prefix,
			label: apiKeys.label,
			expires_at: apiKeys.expires_at,
			scopes_json: apiKeys.scopes_json,
			created_at: apiKeys.created_at,
			revoked_at: apiKeys.revoked_at,
			last_used_at: apiKeys.last_used_at
		})
		.from(apiKeys)
		.where(eq(apiKeys.key_hash, hash))
		.get();
	if (!row || row.revoked_at) return undefined;
	if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return undefined;
	return row;
}
