<script lang="ts">
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Database from 'lucide-svelte/icons/database';
	import FileCode from 'lucide-svelte/icons/file-code';
	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import Library from 'lucide-svelte/icons/library';
	import PenLine from 'lucide-svelte/icons/pen-line';
	import Settings from 'lucide-svelte/icons/settings';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { THEME_STORAGE_KEY } from '$lib/app/brand';
	import { SECTION_PERMISSIONS } from '$lib/app/section-permissions';
	import { authHeaders } from '$lib/client/api-fetch';
	import { apiRoutes } from '$lib/client/api-routes';
	import {
		clearAuth,
		hasPermission,
		type SessionUser,
		sessionUser,
		setSessionUser
	} from '$lib/client/session-user';
	import AppCommandPalette from '$lib/components/app-command-palette.svelte';
	import AppDirtyNavDialog from '$lib/components/app-dirty-nav-dialog.svelte';
	import AppGithubRepoLink from '$lib/components/app-github-repo-link.svelte';
	import AppShellDesktopSidebar from '$lib/components/app-shell-desktop-sidebar.svelte';
	import AppShellMobileNav from '$lib/components/app-shell-mobile-nav.svelte';
	import AppShellMobileTopbar from '$lib/components/app-shell-mobile-topbar.svelte';
	import type { NavGroup } from '$lib/components/app-shell-types';
	import PortfolioDemoBanner from '$lib/components/portfolio-demo-banner.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index';
	import type { HelpLink } from '$lib/types/help-link';

	let {
		children,
		helpLinks,
		openPortfolioDemo = false
	}: { children: Snippet; helpLinks: HelpLink[]; openPortfolioDemo?: boolean } = $props();

	const navGroups: NavGroup[] = [
		{
			label: 'Überblick',
			items: [{ href: '/welcome', label: 'Start', section: 'welcome', Icon: LayoutDashboard }]
		},
		{
			label: 'Paket & Verteilung',
			items: [
				{
					href: '/software-library',
					label: 'Software-Bibliothek',
					section: 'software-library',
					Icon: Library
				},
				{ href: '/script-maker', label: 'Script Maker', section: 'script-maker', Icon: Wand2 },
				{ href: '/script-editor', label: 'Script-Editor', section: 'script-editor', Icon: FileCode }
			]
		},
		{
			label: 'Vorlagen & Daten',
			items: [
				{ href: '/template-editor', label: 'Template-Editor', section: 'template-editor', Icon: BookOpen },
				{ href: '/data-editor', label: 'Daten-Editor', section: 'data-editor', Icon: PenLine },
				{ href: '/stammdaten', label: 'Stammdaten', section: 'stammdaten', Icon: Database }
			]
		},
		{
			label: 'System',
			items: [{ href: '/settings', label: 'Einstellungen', section: 'settings', Icon: Settings }]
		}
	];

	const sectionPaletteKeywords: Record<string, string[]> = {
		welcome: ['Start', 'Überblick'],
		'software-library': ['Software', 'Bibliothek', 'Pakete'],
		'script-maker': ['Paket', 'Bauen', 'Verteilung'],
		'script-editor': ['Editor', 'Skript', 'PSADT', 'Code'],
		'template-editor': ['Vorlage', 'Vorlagen'],
		'data-editor': ['Felder', 'Daten', 'Formular'],
		stammdaten: ['Stammdaten', 'Paketliste', 'Packages', 'Tabelle', 'Datenbank'],
		settings: ['System', 'KI', 'Lint', 'Export', 'Konfiguration']
	};

	let mobileOpen = $state(false);
	let dark = $state(false);
	let shortcutsOpen = $state(false);
	let commandPaletteOpen = $state(false);

	const sessionDisplayName = $derived(
		($sessionUser?.displayName ?? '').trim() || ($sessionUser?.username ?? '').trim()
	);
	const sessionRole = $derived(($sessionUser?.role ?? '').trim());
	const sessionBadge = $derived(
		($sessionUser?.displayName ?? '').trim() || ($sessionUser?.role ?? '').trim()
	);
	const portfolioGuest = $derived($sessionUser?.role === 'PortfolioGast');
	const showPortfolioBanner = $derived(openPortfolioDemo && portfolioGuest);
	const footerLogoutLabel = $derived(openPortfolioDemo && portfolioGuest ? 'Demo neu starten' : 'Abmelden');
	const authed = $derived($sessionUser != null);

	const commandPaletteGroups = $derived(
		navGroups
			.map((g) => ({
				label: g.label,
				items: g.items
					.filter((i) => canSee(i.section))
					.map((i) => ({
						href: i.href,
						label: i.label,
						keywords: sectionPaletteKeywords[i.section] ?? []
					}))
			}))
			.filter((g) => g.items.length > 0)
	);

	function isTypingContext(target: EventTarget | null): boolean {
		if (!target || !(target instanceof HTMLElement)) return false;
		const tag = target.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
		if (target.isContentEditable) return true;
		return target.closest('[contenteditable="true"]') != null;
	}

	function syncThemeClass() {
		if (!browser) return;
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
	}

	function toggleTheme() {
		dark = !dark;
		syncThemeClass();
	}

	onMount(() => {
		if (!browser) return;
		dark = localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
		syncThemeClass();
	});

	$effect(() => {
		if (!browser || !authed) return;
		function onGlobalKeydown(e: KeyboardEvent) {
			if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return;
			if (isTypingContext(e.target)) return;
			e.preventDefault();
			shortcutsOpen = true;
		}
		window.addEventListener('keydown', onGlobalKeydown);
		return () => window.removeEventListener('keydown', onGlobalKeydown);
	});

	$effect(() => {
		if (!browser || !authed) return;
		function onCommandPaletteKey(e: KeyboardEvent) {
			if (e.key !== 'k' && e.key !== 'K') return;
			if (!e.metaKey && !e.ctrlKey) return;
			if (e.altKey) return;
			e.preventDefault();
			commandPaletteOpen = !commandPaletteOpen;
		}
		window.addEventListener('keydown', onCommandPaletteKey);
		return () => window.removeEventListener('keydown', onCommandPaletteKey);
	});

	$effect(() => {
		if (!browser || !authed || !mobileOpen) return;
		function onEscape(e: KeyboardEvent) {
			if (e.key !== 'Escape') return;
			e.preventDefault();
			mobileOpen = false;
		}
		window.addEventListener('keydown', onEscape);
		return () => window.removeEventListener('keydown', onEscape);
	});

	function canSee(section: string) {
		const req = SECTION_PERMISSIONS[section];
		if (!req?.length) return true;
		return req.some((permission) => hasPermission(permission));
	}

	function linkActive(href: string): boolean {
		return $page.url.pathname === href;
	}

	function navLinkClass(href: string): string {
		const active = linkActive(href);
		return active
			? 'bg-primary/12 text-foreground ring-primary/25 font-medium ring-1'
			: 'text-muted-foreground hover:bg-muted/80 hover:text-foreground';
	}

	async function rebootstrapPortfolioGuest(): Promise<void> {
		await fetch(apiRoutes.csrfToken, { credentials: 'same-origin' });
		const r = await fetch(apiRoutes.auth.me, { credentials: 'same-origin' });
		if (!r.ok) return;
		const d = (await r.json()) as { user?: unknown };
		if (d.user) setSessionUser(d.user as SessionUser);
	}

	async function logout() {
		if ($sessionUser) {
			await fetch(apiRoutes.auth.logout, {
				method: 'POST',
				credentials: 'same-origin',
				headers: authHeaders()
			});
		}
		clearAuth();
		if (openPortfolioDemo) {
			await rebootstrapPortfolioGuest();
			await goto('/welcome');
			return;
		}
		await goto('/login');
	}

	async function goToInviteLogin() {
		await goto('/login');
	}
</script>

<div class="bg-background text-foreground flex h-[100dvh] max-h-[100dvh] min-h-0 w-full overflow-hidden">
	<a
		href="#main-content"
		class="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded-md focus:border focus:px-4 focus:py-2"
		>Zum Hauptinhalt springen</a
	>
	{#if authed}
		<div class="pointer-events-none fixed top-3 right-3 z-[55] hidden md:block">
			<div class="pointer-events-auto">
				<AppGithubRepoLink />
			</div>
		</div>
	{/if}

	{#if authed}
		<AppShellMobileNav
			open={mobileOpen}
			{navGroups}
			{canSee}
			{linkActive}
			{navLinkClass}
			{helpLinks}
			{sessionDisplayName}
			{sessionRole}
			{openPortfolioDemo}
			{portfolioGuest}
			{footerLogoutLabel}
			onClose={() => (mobileOpen = false)}
			onLogout={logout}
			onInviteLogin={goToInviteLogin}
		/>
		<AppShellDesktopSidebar
			{navGroups}
			{canSee}
			{linkActive}
			{navLinkClass}
			{helpLinks}
			{dark}
			{openPortfolioDemo}
			{portfolioGuest}
			{footerLogoutLabel}
			onOpenShortcuts={() => (shortcutsOpen = true)}
			onOpenCommandPalette={() => (commandPaletteOpen = true)}
			onToggleTheme={toggleTheme}
			onLogout={logout}
			onInviteLogin={goToInviteLogin}
		/>
	{/if}

	<main
		id="main-content"
		class="app-main-surface flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:shadow-[inset_0_1px_0_0_oklch(1_0_0/6%)]"
	>
		{#if authed}
			<AppShellMobileTopbar
				{mobileOpen}
				{dark}
				{sessionBadge}
				{openPortfolioDemo}
				{portfolioGuest}
				onOpenMobile={() => (mobileOpen = true)}
				onOpenShortcuts={() => (shortcutsOpen = true)}
				onOpenCommandPalette={() => (commandPaletteOpen = true)}
				onToggleTheme={toggleTheme}
				onInviteLogin={goToInviteLogin}
			/>
		{/if}
		<div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
			{#if showPortfolioBanner}
				<PortfolioDemoBanner />
			{/if}
			{@render children()}
		</div>
	</main>

	{#if authed}
		<AppCommandPalette bind:open={commandPaletteOpen} groups={commandPaletteGroups} />
		<AppDirtyNavDialog />
		<Sheet.Root bind:open={shortcutsOpen}>
			<Sheet.Content side="right" class="w-full sm:max-w-md">
				<Sheet.Header>
					<Sheet.Title>Tastenkürzel</Sheet.Title>
					<Sheet.Description>
						App-weit gilt: kein Fokus in Eingabefeldern oder im Code-Editor — dort ist „?“ ein normales
						Zeichen. Auf dem Smartphone: Tastatur-Icon in der Kopfzeile öffnet dieselbe Übersicht.
					</Sheet.Description>
				</Sheet.Header>
				<div class="text-muted-foreground space-y-6 px-4 pb-6 text-sm">
					<section class="space-y-2" aria-labelledby="kbd-app-heading">
						<h3 id="kbd-app-heading" class="text-foreground text-xs font-semibold tracking-wide uppercase">
							App-weit
						</h3>
						<dl class="space-y-3">
							<div class="flex justify-between gap-4 border-b border-dashed pb-3">
								<dt>
									<kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">Strg+K</kbd>
									<span class="text-muted-foreground/80 mx-1">/</span>
									<kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">⌘K</kbd>
								</dt>
								<dd class="max-w-[14rem] text-right">Schnellnavigation: Seite suchen und springen</dd>
							</div>
							<div class="flex justify-between gap-4 border-b border-dashed pb-3">
								<dt><kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">?</kbd></dt>
								<dd class="max-w-[14rem] text-right">Diese Übersicht öffnen</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt><kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">Esc</kbd></dt>
								<dd class="max-w-[14rem] text-right">
									Offenes Seitenpanel schließen (Shortcuts, Mobil-Menü), wenn der Fokus nicht im Editor liegt
								</dd>
							</div>
						</dl>
					</section>
					<section class="space-y-2" aria-labelledby="kbd-editor-heading">
						<h3 id="kbd-editor-heading" class="text-foreground text-xs font-semibold tracking-wide uppercase">
							Code-Editor
						</h3>
						<p class="text-muted-foreground text-xs leading-snug">
							Gilt im Script- und Template-Editor, sobald der Cursor im Skript- bzw. Vorlagenfeld steht.
						</p>
						<dl class="space-y-3">
							<div class="flex justify-between gap-4 border-b border-dashed pb-3">
								<dt>
									<kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">Strg+F</kbd>
									<span class="text-muted-foreground/80 mx-1">/</span>
									<kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">⌘F</kbd>
								</dt>
								<dd class="max-w-[14rem] text-right">Suche im Skript / in der Vorlage</dd>
							</div>
							<div class="flex justify-between gap-4 border-b border-dashed pb-3">
								<dt>
									<kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">Strg+H</kbd>
									<span class="text-muted-foreground/80 mx-1">/</span>
									<kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">⌥⌘F</kbd>
								</dt>
								<dd class="max-w-[14rem] text-right">Ersetzen (wenn die Editor-Suche aktiv ist)</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt><kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">Esc</kbd></dt>
								<dd class="max-w-[14rem] text-right">Offene Editor-Suche oder Ersetzen-Dialog schließen</dd>
							</div>
						</dl>
					</section>
				</div>
			</Sheet.Content>
		</Sheet.Root>
	{/if}
</div>
