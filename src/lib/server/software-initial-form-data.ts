/**
 * Stammdaten-JSON (`software.form_data`) beim Anlegen: Keys = Formularfeld-`label`,
 * Werte aus `default_value` bzw. leerer String — konsistent mit Script-/Daten-Editor.
 */
export function initialFormDataObjectFromFormfieldRows(
	rows: readonly { label: string; is_spacer: boolean; default_value: string | null }[]
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const r of rows) {
		if (r.is_spacer) continue;
		const d = r.default_value;
		out[r.label] = d != null && d !== '' ? d : '';
	}
	return out;
}
