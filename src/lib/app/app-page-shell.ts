const shellBase = 'text-foreground mx-auto w-full max-w-6xl px-4 md:px-6';

/**
 * Einheitliche Hauptfläche für Routen unter `(app)`:
 * zentriert, gleiche Außenabstände, gleiche Maximalbreite wie Einstellungen.
 */
export const APP_PAGE_SHELL_CLASS = `${shellBase} py-5 md:py-6`;

/** Wie Shell, unten mehr Luft (lange Listen, viele Karten). */
export const APP_PAGE_SHELL_LOOSE_BOTTOM_CLASS = `${shellBase} pt-5 pb-12 md:pt-6 md:pb-14`;
