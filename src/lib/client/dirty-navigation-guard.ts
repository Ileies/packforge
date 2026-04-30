import { dirtyNavConfirmPending } from './dirty-nav-bridge';

export const DIRTY_NAVIGATION_WARNING_DE =
	'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';

export function handleDirtyBeforeUnload(event: BeforeUnloadEvent, isDirty: boolean): void {
	if (!isDirty) return;
	event.preventDefault();
	event.returnValue = DIRTY_NAVIGATION_WARNING_DE;
}

/**
 * Zugänglicher Bestätigungsdialog (Shell: `AppDirtyNavDialog`) — nicht `window.confirm`.
 */
export function confirmDirtyInAppNavigationAsync(
	isDirty: boolean,
	message: string = DIRTY_NAVIGATION_WARNING_DE
): Promise<boolean> {
	if (!isDirty) return Promise.resolve(true);
	if (typeof window === 'undefined') return Promise.resolve(true);
	return new Promise((resolve) => {
		dirtyNavConfirmPending.set({ message, resolve });
	});
}
