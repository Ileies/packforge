import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * `child`/`children` sind in Svelte/shadcn oft optional mit beliebigem Snippet-/Elementtyp;
 * `unknown` verhindert, dass `any` durch Conditional Types in Komponenten-Props „durchsickert“.
 */
export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

export type WithElementRef<
	T extends object = object,
	U extends HTMLElement | SVGSVGElement | null = HTMLElement | null
> = T & { ref?: U | null };
