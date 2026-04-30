/**
 * Regeln für lokalen Login ohne Entra (reine Funktion, testbar).
 * - `ALLOW_DEV_LOGIN=false` → aus
 * - `ALLOW_DEV_LOGIN` = `true` / `1` / `yes` (case-insensitive) → an
 * - nicht gesetzt oder anderer Wert → aus (kein implizites „an“ außerhalb Production)
 */
export function computeDevLoginAllowed(
	_nodeEnv: string | undefined,
	allowDevLogin: string | undefined
): boolean {
	if (allowDevLogin === 'false') return false;
	const v = allowDevLogin?.trim().toLowerCase();
	return v === 'true' || v === '1' || v === 'yes';
}
