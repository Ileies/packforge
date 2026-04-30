<script lang="ts">
	import { Command, Dialog } from 'bits-ui';
	import XIcon from 'lucide-svelte/icons/x';

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index';
	import { cn } from '$lib/utils';

	type PaletteItem = {
		href: string;
		label: string;
		keywords?: string[];
	};

	type PaletteGroup = {
		label: string;
		items: PaletteItem[];
	};

	let {
		open = $bindable(false),
		groups
	}: {
		open?: boolean;
		groups: PaletteGroup[];
	} = $props();

	let search = $state('');

	function pick(href: string) {
		open = false;
		void goto(href as Parameters<typeof goto>[0]);
	}

	function itemKeywords(item: PaletteItem): string[] {
		const slug = item.href.replace(/^\//, '').replaceAll('-', ' ');
		return [item.label, slug, ...(item.keywords ?? [])];
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(o) => {
		if (!o) search = '';
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay
			class={cn(
				'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[60] bg-black/50 supports-backdrop-filter:backdrop-blur-xs'
			)}
		/>
		<Dialog.Content
			class={cn(
				'border-border bg-background data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[min(12vh,6rem)] left-[50%] z-[61] flex max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),26rem)] -translate-x-1/2 flex-col gap-0 overflow-hidden rounded-xl border p-0 shadow-lg duration-200'
			)}
		>
			<Dialog.Title class="sr-only">Schnellnavigation</Dialog.Title>
			<Dialog.Description class="sr-only">
				Suche nach einer Seite und bestätige mit Eingabe, oder schließe mit Escape.
			</Dialog.Description>

			<div class="relative border-b px-3 pt-3 pb-2">
				<Dialog.Close>
					{#snippet child({ props })}
						<Button
							variant="ghost"
							size="icon"
							class="absolute top-2 right-2 size-8"
							aria-label="Schließen"
							{...props}
						>
							<XIcon class="size-4" aria-hidden="true" />
						</Button>
					{/snippet}
				</Dialog.Close>
				<Command.Root label="Schnellnavigation" loop class="flex min-h-0 flex-col gap-2 pr-10">
					<Command.Input
						bind:value={search}
						autofocus
						placeholder="Seite suchen …"
						class="border-input bg-muted/40 text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
					/>
					<Command.List class="min-h-0 flex-1 overflow-hidden px-1 pb-2">
						<Command.Viewport class="max-h-[min(52vh,22rem)] overflow-y-auto overscroll-y-contain p-1">
							<Command.Empty class="text-muted-foreground px-3 py-6 text-center text-sm">
								Kein Treffer für diese Suche.
							</Command.Empty>
							{#each groups as group (group.label)}
								<Command.Group value={group.label} class="mb-2 last:mb-0">
									<Command.GroupHeading
										class="text-muted-foreground px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase"
									>
										{group.label}
									</Command.GroupHeading>
									<Command.GroupItems>
										{#each group.items as item (item.href)}
											<Command.Item
												value={item.href}
												keywords={itemKeywords(item)}
												onSelect={() => pick(item.href)}
												class="aria-selected:bg-accent aria-selected:text-accent-foreground flex cursor-pointer items-center rounded-md px-2 py-2 text-sm outline-none"
											>
												<span class="truncate">{item.label}</span>
											</Command.Item>
										{/each}
									</Command.GroupItems>
								</Command.Group>
							{/each}
						</Command.Viewport>
					</Command.List>
				</Command.Root>
			</div>
			<p class="text-muted-foreground border-t px-3 py-2 text-[11px] leading-snug">
				<kbd class="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">↑</kbd>
				<kbd class="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">↓</kbd>
				auswählen ·
				<kbd class="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
				öffnen ·
				<kbd class="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">Esc</kbd>
				schließen
			</p>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
