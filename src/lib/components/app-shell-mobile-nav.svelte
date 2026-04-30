<script lang="ts">
	import { LogIn, LogOut, Package } from '@lucide/svelte';

	import { PRODUCT_NAME } from '$lib/app/brand';
	import AppShellGithubFooterLink from '$lib/components/app-shell-github-footer-link.svelte';
	import AppShellHelpLinks from '$lib/components/app-shell-help-links.svelte';
	import AppShellNavigation from '$lib/components/app-shell-navigation.svelte';
	import type { NavGroup } from '$lib/components/app-shell-types';
	import { Button } from '$lib/components/ui/button/index';
	import type { HelpLink } from '$lib/types/help-link';

	let {
		open,
		navGroups,
		canSee,
		linkActive,
		navLinkClass,
		helpLinks,
		sessionDisplayName,
		sessionRole,
		openPortfolioDemo = false,
		portfolioGuest = false,
		onClose,
		onLogout,
		onInviteLogin
	}: {
		open: boolean;
		navGroups: NavGroup[];
		canSee: (section: string) => boolean;
		linkActive: (href: string) => boolean;
		navLinkClass: (href: string) => string;
		helpLinks: HelpLink[];
		sessionDisplayName: string;
		sessionRole: string;
		openPortfolioDemo?: boolean;
		portfolioGuest?: boolean;
		onClose: () => void;
		onLogout: () => void;
		onInviteLogin: () => void;
	} = $props();
</script>

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/40 md:hidden"
		aria-label="Menü schließen"
		onclick={onClose}
	></button>
	<div
		id="mobile-nav"
		role="dialog"
		aria-modal="true"
		aria-label="Hauptnavigation"
		class="border-border bg-card fixed top-0 left-0 z-50 flex h-full w-[min(100vw-2rem,18rem)] flex-col border-r shadow-xl md:hidden"
	>
		<div class="border-border flex items-start justify-between gap-2 border-b px-3 py-3">
			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<span
						class="bg-primary/15 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
					>
						<Package class="size-4" aria-hidden="true" />
					</span>
					<span class="truncate font-semibold tracking-tight">{PRODUCT_NAME}</span>
				</div>
				{#if sessionDisplayName || sessionRole}
					<div class="border-border/70 bg-muted/40 mt-2 ml-10 rounded-md border px-2.5 py-2">
						<p class="text-foreground truncate text-xs font-medium">{sessionDisplayName || 'Angemeldet'}</p>
						{#if portfolioGuest}
							<p class="text-muted-foreground text-[11px] leading-snug">Öffentliche Demo (Lesen)</p>
						{:else if sessionRole}
							<p class="text-muted-foreground text-[11px] leading-snug">Rolle: {sessionRole}</p>
						{/if}
					</div>
				{/if}
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				aria-label="Menü schließen"
				onclick={onClose}>✕</Button
			>
		</div>

		<AppShellNavigation
			{navGroups}
			{canSee}
			{linkActive}
			{navLinkClass}
			ariaLabel="Menüeinträge"
			baseLinkClass="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
			onNavigate={onClose}
		/>

		<AppShellHelpLinks
			{helpLinks}
			linkClass="text-muted-foreground hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground"
			onNavigate={onClose}
		/>

		<div class="border-border bg-muted/20 border-t px-2 py-2">
			<AppShellGithubFooterLink class="w-full justify-start" />
			<div class="mt-2 space-y-1.5">
				{#if openPortfolioDemo && portfolioGuest}
					<Button
						variant="outline"
						class="border-border bg-background text-foreground hover:bg-muted/50 h-9 w-full cursor-pointer justify-center gap-2 font-normal shadow-none"
						title="Anmelden"
						aria-label="Anmelden"
						onclick={() => {
							onInviteLogin();
							onClose();
						}}
					>
						<LogIn class="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
						Anmelden
					</Button>
				{:else if !portfolioGuest}
					<Button
						variant="outline"
						class="border-border bg-background text-foreground hover:bg-muted/50 h-9 w-full cursor-pointer justify-center gap-2 font-normal shadow-none"
						onclick={onLogout}
					>
						<LogOut class="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
						Abmelden
					</Button>
				{/if}
			</div>
		</div>
	</div>
{/if}
