/** Minimales Import-Paket wie `tests/fixtures/formfields-minimal.json` — für Tests ohne doppelte JSON-Dateien. */
export function createMinimalFormfieldsImportPackage(
	overrides: {
		version?: string;
		exportedAt?: string;
	} = {}
) {
	return {
		version: overrides.version ?? '1.0',
		exportedAt: overrides.exportedAt ?? '2026-04-29T00:00:00.000Z',
		formfields: [
			{
				name: 'TestField',
				label: 'TestFieldLabelUnique',
				required: false,
				validation: '',
				predefinedvalues: false,
				field_scope: 'both'
			}
		]
	};
}
