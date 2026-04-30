<script lang="ts">
	import { ArrowRight, Lock } from '@lucide/svelte';

	import { resolve } from '$app/paths';
	import { APP_PAGE_SHELL_CLASS } from '$lib/app/app-page-shell';
	import { PRODUCT_NAME } from '$lib/app/brand';
	import { userMayAccessSectionWithPerms } from '$lib/client/section-access';
	import { sessionUser } from '$lib/client/session-user';
	import { WELCOME_AREA_GROUPS, WELCOME_WORKFLOW } from '$lib/client/welcome-page-content';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';

	function mayAccessSection(section: string): boolean {
		return userMayAccessSectionWithPerms(section, $sessionUser?.permissions);
	}
</script>

<svelte:head>
	<title>Start — {PRODUCT_NAME}</title>
</svelte:head>

<div class="min-h-full">
	<div class="{APP_PAGE_SHELL_CLASS} space-y-10">
		<section id="welcome-hero" class="space-y-4">
			<h1 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
				Pakete planen, bauen und übergeben
			</h1>
			<p class="text-muted-foreground max-w-3xl text-base leading-relaxed sm:text-lg">
				<strong class="text-foreground font-medium">{PRODUCT_NAME}</strong> bündelt Stammdaten, Vorlagen und Skripte
				an einem Ort — PSADT-Pakete erzeugen, nachbearbeiten und als ZIP aus der Software-Bibliothek verteilen.
			</p>
		</section>

		<section id="welcome-workflow" aria-labelledby="workflow-heading" class="space-y-3">
			<h2 id="workflow-heading" class="text-foreground text-lg font-semibold tracking-tight">
				Typischer Dreischritt
			</h2>
			<p class="text-muted-foreground max-w-3xl text-sm leading-relaxed">
				Orientierung ohne zweite Navigation — Ziele erreichen Sie über die Kacheln unten oder die Einträge
				links.
			</p>
			<ol class="border-border bg-muted/25 divide-border max-w-3xl divide-y rounded-lg border">
				{#each WELCOME_WORKFLOW as w (w.step)}
					<li class="flex gap-4 px-4 py-3.5 first:rounded-t-lg last:rounded-b-lg">
						<span
							class="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
							aria-hidden="true">{w.step}</span
						>
						<div class="min-w-0 space-y-1">
							<p class="text-foreground font-medium">{w.title}</p>
							<p class="text-muted-foreground text-sm leading-relaxed">{w.body}</p>
						</div>
					</li>
				{/each}
			</ol>
		</section>

		{#each WELCOME_AREA_GROUPS as g, gi (g.label)}
			<section
				id={gi === 0 ? 'welcome-areas' : undefined}
				class="space-y-3"
				aria-labelledby="welcome-group-{gi}"
			>
				<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 id="welcome-group-{gi}" class="text-foreground text-lg font-semibold tracking-tight">
							{g.label}
						</h2>
						<p class="text-muted-foreground text-sm">{g.hint}</p>
					</div>
				</div>
				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each g.items as item (item.href)}
						{@const allowed = mayAccessSection(item.section)}
						{#if allowed}
							<a
								href={resolve(item.href)}
								class="group border-border bg-card shadow-none hover:border-primary/40 focus-visible:ring-ring flex h-full min-h-0 flex-col rounded-xl border transition-all focus-visible:ring-[3px] focus-visible:outline-none"
							>
								<Card class="border-0 shadow-none ring-0 flex min-h-0 flex-1 flex-col gap-0 py-0">
									<CardHeader class="flex flex-1 flex-col pt-4 pb-2">
										<div
											class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
										>
											<item.Icon class="size-5" aria-hidden="true" />
										</div>
										<CardTitle
											class="text-foreground group-hover:text-primary pt-1 text-base transition-colors"
										>
											{item.title}
										</CardTitle>
										<CardDescription class="leading-relaxed">{item.desc}</CardDescription>
									</CardHeader>
									<CardContent
										class="text-primary mt-auto flex items-center gap-1 pb-4 pt-1 text-sm font-medium"
									>
										Bereich öffnen
										<ArrowRight
											class="size-4 transition-transform group-hover:translate-x-0.5"
											aria-hidden="true"
										/>
									</CardContent>
								</Card>
							</a>
						{:else}
							<div
								class="border-border bg-card text-card-foreground flex h-full min-h-0 cursor-not-allowed flex-col rounded-xl border shadow-none select-none"
								role="group"
								aria-disabled="true"
								aria-label="{item.title}: in dieser Sitzung nicht verfügbar"
								tabindex="-1"
							>
								<Card
									class="border-0 bg-card text-card-foreground shadow-none ring-0 flex min-h-0 flex-1 flex-col gap-0 py-0"
								>
									<CardHeader class="flex flex-1 flex-col pt-4 pb-2">
										<div
											class="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg"
										>
											<Lock class="size-4" aria-hidden="true" />
										</div>
										<CardTitle class="text-muted-foreground pt-1 text-base font-medium">
											{item.title}
										</CardTitle>
										<CardDescription class="text-muted-foreground leading-relaxed">{item.desc}</CardDescription>
									</CardHeader>
									<CardContent
										class="text-muted-foreground mt-auto flex items-center gap-1.5 pb-4 pt-1 text-sm font-medium"
									>
										<Lock class="size-3.5 shrink-0" aria-hidden="true" />
										Nicht verfügbar
									</CardContent>
								</Card>
							</div>
						{/if}
					{/each}
				</div>
			</section>
		{/each}
	</div>
</div>
