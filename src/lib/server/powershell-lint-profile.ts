import { getSetting, setSetting } from './repo/settings.repo';

export const POWERSHELL_LINT_PROFILE_KEY = 'powershell_lint_profile';

export type PowerShellLintProfile = 'relaxed' | 'strict';

let cached: PowerShellLintProfile | null = null;

export function parsePowerShellLintProfile(raw: string | null | undefined): PowerShellLintProfile {
	if (raw === 'strict' || raw === 'relaxed') return raw;
	return 'relaxed';
}

export function getPowerShellLintProfile(): PowerShellLintProfile {
	if (cached !== null) return cached;
	cached = parsePowerShellLintProfile(getSetting(POWERSHELL_LINT_PROFILE_KEY));
	return cached;
}

export function setPowerShellLintProfile(profile: PowerShellLintProfile): void {
	cached = profile;
	setSetting(POWERSHELL_LINT_PROFILE_KEY, profile);
}
