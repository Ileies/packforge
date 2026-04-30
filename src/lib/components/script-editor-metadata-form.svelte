<script lang="ts">
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { Textarea } from '$lib/components/ui/textarea/index';

	type Props = {
		showFormJson: boolean;
		disabled: boolean;
		name?: string;
		version?: string;
		formDataRaw?: string;
	};

	let {
		showFormJson,
		disabled,
		name = $bindable(''),
		version = $bindable(''),
		formDataRaw = $bindable('{}')
	}: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<div class="space-y-2">
		<Label for="nm">Name</Label>
		<Input id="nm" bind:value={name} {disabled} />
	</div>
	<div class="space-y-2">
		<Label for="ver">Version</Label>
		<Input id="ver" bind:value={version} {disabled} />
	</div>
</div>
{#if showFormJson}
	<div class="space-y-2">
		<Label for="fd">Formular-Daten (JSON)</Label>
		<Textarea id="fd" bind:value={formDataRaw} rows={5} class="font-mono text-xs" {disabled} />
	</div>
{/if}
