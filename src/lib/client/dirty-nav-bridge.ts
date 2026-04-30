import { get, writable } from 'svelte/store';

export type DirtyNavConfirmPending = {
	message: string;
	resolve: (leave: boolean) => void;
};

/** Wird von `AppDirtyNavDialog` in der Shell konsumiert. */
export const dirtyNavConfirmPending = writable<DirtyNavConfirmPending | null>(null);

export function answerDirtyNavConfirm(leave: boolean) {
	const p = get(dirtyNavConfirmPending);
	p?.resolve(leave);
	dirtyNavConfirmPending.set(null);
}
