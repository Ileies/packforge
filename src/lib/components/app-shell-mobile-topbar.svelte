<script lang="ts">
	import Keyboard from 'lucide-svelte/icons/keyboard';
	import LogIn from 'lucide-svelte/icons/log-in';
	import Menu from 'lucide-svelte/icons/menu';
	import Moon from 'lucide-svelte/icons/moon';
	import Search from 'lucide-svelte/icons/search';
	import Sun from 'lucide-svelte/icons/sun';

	import AppGithubRepoLink from '$lib/components/app-github-repo-link.svelte';
	import { Button } from '$lib/components/ui/button/index';

	let {
		mobileOpen,
		dark,
		sessionBadge,
		openPortfolioDemo = false,
		portfolioGuest = false,
		onOpenMobile,
		onOpenShortcuts,
		onOpenCommandPalette,
		onToggleTheme,
		onInviteLogin
	}: {
		mobileOpen: boolean;
		dark: boolean;
		sessionBadge: string;
		openPortfolioDemo?: boolean;
		portfolioGuest?: boolean;
		onOpenMobile: () => void;
		onOpenShortcuts: () => void;
		onOpenCommandPalette: () => void;
		onToggleTheme: () => void;
		onInviteLogin: () => void;
	} = $props();
</script>

<div
	class="border-border bg-background/80 supports-[backdrop-filter]:bg-background/70 z-30 flex h-12 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md md:hidden"
>
	<Button
		variant="outline"
		size="sm"
		class="gap-1.5"
		aria-expanded={mobileOpen}
		aria-controls={mobileOpen ? 'mobile-nav' : undefined}
		onclick={onOpenMobile}
	>
		<Menu class="size-4" aria-hidden="true" />
		Menü
	</Button>
	<Button
		variant="ghost"
		size="icon"
		class="size-8"
		title="Schnellnavigation"
		aria-label="Schnellnavigation öffnen"
		onclick={onOpenCommandPalette}
	>
		<Search class="size-4" aria-hidden="true" />
	</Button>
	<Button
		variant="ghost"
		size="icon"
		class="size-8"
		title="Tastenkürzel"
		aria-label="Tastenkürzel anzeigen"
		onclick={onOpenShortcuts}
	>
		<Keyboard class="size-4" aria-hidden="true" />
	</Button>
	{#if openPortfolioDemo && portfolioGuest}
		<Button
			variant="outline"
			size="sm"
			class="h-7 shrink-0 gap-1 px-2 text-xs"
			title="Anmelden"
			aria-label="Anmelden"
			onclick={onInviteLogin}
		>
			<LogIn class="size-3.5" aria-hidden="true" />
			Anmelden
		</Button>
	{/if}
	{#if sessionBadge}
		<span class="text-muted-foreground max-w-[6rem] truncate text-xs sm:max-w-[7.5rem]">{sessionBadge}</span>
	{/if}
	<div class="ml-auto flex shrink-0 items-center gap-1">
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
		<AppGithubRepoLink class="size-8 [&_svg]:size-4" />
	</div>
</div>
