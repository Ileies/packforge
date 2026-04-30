<script lang="ts">
	import { type Snippet, tick } from 'svelte';

	type Props = {
		/** Bei truthy Wert und bei jeder Änderung: nach `tick` fokussieren (A11y für neue Fehler/Meldungen). */
		when: unknown;
		elementId?: string | undefined;
		class?: string;
		role?: string | null;
		/** Entspricht HTML `aria-live` (Screenreader-Priorität bei dynamischen Inhalten). */
		ariaLive?: 'off' | 'polite' | 'assertive' | null | undefined;
		tabindex?: number;
		children: Snippet;
	};

	let {
		when,
		elementId = undefined,
		class: className = '',
		role = undefined,
		ariaLive = undefined,
		tabindex = -1,
		children
	}: Props = $props();

	let el = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!when) return;
		void tick().then(() => el?.focus());
	});
</script>

<!-- Fokus nach dynamischer Meldung — bewusst tabindex -1 auf Wrapper. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div bind:this={el} id={elementId} class={className} {role} aria-live={ariaLive ?? undefined} {tabindex}>
	{@render children()}
</div>
