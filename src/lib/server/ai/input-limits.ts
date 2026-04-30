/** Server-seitige Grenzen für KI-Anfragen (Roadmap: Prompt-Injection / Abuse-Minderung). */

export const MAX_AI_SCRIPT_CHARS = 600_000;
export const MAX_AI_USER_TEXT_CHARS = 32_000;
export const MAX_AI_LABEL_CHARS = 512;
/** Serialisiertes formData JSON für Enrichment */
export const MAX_AI_FORM_DATA_JSON_CHARS = 200_000;
/** `POST /api/ai/response`: optionale System-/Zusatzanweisungen (Ad-hoc-Pfad). */
export const MAX_AI_RESPONSE_INSTRUCTIONS_CHARS = 16_000;
/** OpenAI-Prompt-ID oder kurzer Schlüssel — kein beliebig langer String. */
export const MAX_AI_RESPONSE_PROMPT_ID_CHARS = 128;
/** Modell-Override im Request-Body (Anzeigename / API-Modell-ID). */
export const MAX_AI_RESPONSE_MODEL_OVERRIDE_CHARS = 80;

export function rejectIfTooLong(label: string, value: string, max: number): string | null {
	if (value.length > max) return `${label}: maximal ${max.toLocaleString('de-DE')} Zeichen erlaubt.`;
	return null;
}
