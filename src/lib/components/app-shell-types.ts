export type IconComponent = typeof import('lucide-svelte/icons/library').default;

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
