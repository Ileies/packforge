import { writable } from 'svelte/store';

export type PushSuccessToastOptions = {
	/** Standard 3500 ms; mit `onUndo` mindestens `UNDO_TOAST_MIN_DURATION_MS`. */
	durationMs?: number;
	/** Optional: Aktion „Rückgängig“ (z. B. letzte Listenmutation). */
	onUndo?: () => void | Promise<void>;
	undoLabel?: string;
};

export type SuccessToastItem = {
	id: string;
	message: string;
	onUndo?: () => void | Promise<void>;
	undoLabel?: string;
};

const DEFAULT_DURATION_MS = 3500;
/** Längere Sichtbarkeit, damit „Rückgängig“ erreichbar bleibt. */
const UNDO_TOAST_MIN_DURATION_MS = 9000;

export const successToasts = writable<SuccessToastItem[]>([]);

/** Nicht blockierender Erfolgs-Toast; stapelt sich, Auto-Ausblendung, manuell schließbar; optional Rückgängig. */
export function pushSuccessToast(message: string, options: PushSuccessToastOptions = {}): string {
	const id = crypto.randomUUID();
	const hasUndo = Boolean(options.onUndo);
	const durationMs = hasUndo
		? Math.max(options.durationMs ?? DEFAULT_DURATION_MS, UNDO_TOAST_MIN_DURATION_MS)
		: (options.durationMs ?? DEFAULT_DURATION_MS);
	const item: SuccessToastItem = {
		id,
		message,
		...(hasUndo
			? {
					onUndo: options.onUndo,
					undoLabel: options.undoLabel?.trim() || 'Rückgängig'
				}
			: {})
	};
	successToasts.update((items) => [...items, item]);
	if (typeof window !== 'undefined' && durationMs > 0) {
		window.setTimeout(() => {
			dismissSuccessToast(id);
		}, durationMs);
	}
	return id;
}

export function dismissSuccessToast(id: string): void {
	successToasts.update((items) => items.filter((t) => t.id !== id));
}
