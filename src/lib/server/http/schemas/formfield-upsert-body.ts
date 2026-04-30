import z from 'zod';

/** JSON-Body für POST/PUT `/api/formfields` bzw. `/api/formfields/[id]` (Felder optional, unbekannte Keys erlaubt). */
export const formfieldUpsertBodySchema = z
	.object({
		isSpacer: z.boolean().optional(),
		name: z.unknown().optional(),
		label: z.unknown().optional(),
		required: z.unknown().optional(),
		validation: z.unknown().optional(),
		predefinedvalues: z.unknown().optional(),
		predefinedvaluesMap: z.unknown().optional(),
		autofillSource: z.unknown().optional(),
		isInstallerDropdown: z.unknown().optional(),
		isReadonly: z.unknown().optional(),
		info: z.unknown().optional(),
		defaultValue: z.unknown().optional(),
		isDropdown: z.unknown().optional(),
		dropdownValues: z.unknown().optional(),
		fieldScope: z.unknown().optional()
	})
	.passthrough();

/** Nur echte Strings; sonst `null` (kein JSON-Fallback). */
export function optionalJsonString(v: unknown): string | null {
	if (v == null) return null;
	return typeof v === 'string' ? v : null;
}

export function fieldScopeFromUnknown(v: unknown): string {
	return typeof v === 'string' && v.trim() ? v : 'both';
}
