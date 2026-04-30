<script lang="ts">
	import Keyboard from 'lucide-svelte/icons/keyboard';
	import LogIn from 'lucide-svelte/icons/log-in';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Moon from 'lucide-svelte/icons/moon';
	import Package from 'lucide-svelte/icons/package';
	import Search from 'lucide-svelte/icons/search';
	import Sun from 'lucide-svelte/icons/sun';

	import { PRODUCT_DOMAIN_LINE, PRODUCT_NAME } from '$lib/app/brand';
	import AppShellHelpLinks from '$lib/components/app-shell-help-links.svelte';
	import AppShellNavigation from '$lib/components/app-shell-navigation.svelte';
	import type { NavGroup } from '$lib/components/app-shell-types';
	import { Button } from '$lib/components/ui/button/index';
	import type { HelpLink } from '$lib/types/help-link';

	let {
		navGroups,
		canSee,
		linkActive,
		navLinkClass,
		helpLinks,
		dark,
		onOpenShortcuts,
		onOpenCommandPalette,
		onToggleTheme,
		onLogout,
		openPortfolioDemo = false,
		portfolioGuest = false,
		footerLogoutLabel = 'Abmelden',
		onInviteLogin
	}: {
		navGroups: NavGroup[];
		canSee: (section: string) => boolean;
		linkActive: (href: string) => boolean;
		navLinkClass: (href: string) => string;
		helpLinks: HelpLink[];
		dark: boolean;
		onOpenShortcuts: () => void;
		onOpenCommandPalette: () => void;
		onToggleTheme: () => void;
		onLogout: () => void;
		openPortfolioDemo?: boolean;
		portfolioGuest?: boolean;
		footerLogoutLabel?: string;
		onInviteLogin: () => void;
	} = $props();
</script>

<aside
	class="border-border from-card to-card/95 supports-[backdrop-filter]:bg-card/75 hidden h-full min-h-0 w-[17rem] shrink-0 flex-col border-r bg-gradient-to-b shadow-sm backdrop-blur-md md:flex"
>
	<div class="border-border flex flex-col gap-2 border-b px-3 py-3">
		<div class="flex items-start justify-between gap-2">
			<div class="flex min-w-0 items-start gap-2.5">
				<span
					class="bg-primary/15 text-primary mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg"
				>
					<Package class="size-[1.125rem]" aria-hidden="true" />
				</span>
				<div class="min-w-0 self-center space-y-0.5">
					<span class="font-semibold tracking-tight">{PRODUCT_NAME}</span>
					<p class="text-muted-foreground text-xs leading-snug">{PRODUCT_DOMAIN_LINE}</p>
				</div>
			</div>
			<div class="flex shrink-0 items-center gap-0.5">
				<Button
					variant="ghost"
					size="icon"
					class="size-8"
					title="Schnellnavigation (Strg+K / ⌘K)"
					aria-label="Schnellnavigation öffnen"
					onclick={onOpenCommandPalette}
				>
					<Search class="size-4" aria-hidden="true" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					class="size-8"
					title="Tastenkürzel (?)"
					aria-label="Tastenkürzel anzeigen"
					onclick={onOpenShortcuts}
				>
					<Keyboard class="size-4" aria-hidden="true" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					class="size-8"
					title="Hell/Dunkel"
					aria-label={dark ? 'Zu hellem Farbschema wechseln' : 'Zu dunklem Farbschema wechseln'}
					onclick={onToggleTheme}
				>
					{#if dark}
						<Sun class="size-4" aria-hidden="true" />
					{:else}
						<Moon class="size-4" aria-hidden="true" />
					{/if}
				</Button>
			</div>
		</div>
	</div>

	<AppShellNavigation
		{navGroups}
		{canSee}
		{linkActive}
		{navLinkClass}
		ariaLabel="Hauptnavigation"
		baseLinkClass="hover:bg-muted/80 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
	/>

	<AppShellHelpLinks
		{helpLinks}
		linkClass="text-muted-foreground hover:bg-muted/80 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground"
	/>

	<div class="border-border mt-auto flex shrink-0 flex-col gap-2 border-t p-2">
		{#if openPortfolioDemo && portfolioGuest}
			<Button variant="default" class="justify-start gap-2" onclick={onInviteLogin} title="Anmelden" aria-label="Anmelden">
				<LogIn class="size-4" aria-hidden="true" />
				Anmelden
			</Button>
		{/if}
		<Button variant="ghost" class="justify-start gap-2" onclick={onLogout}>
			<LogOut class="size-4" aria-hidden="true" />
			{footerLogoutLabel}
		</Button>
	</div>
</aside>
