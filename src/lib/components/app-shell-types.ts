import type { Library } from '@lucide/svelte';

export type IconComponent = typeof Library;

export type NavItem = {
	href: string;
	label: string;
	section: string;
	Icon: IconComponent;
};

export type NavGroup = {
	label: string;
	items: NavItem[];
};
