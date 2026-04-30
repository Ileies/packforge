import { extname } from 'node:path';

/** Hauptinstaller (.exe/.msi): PE (MZ) oder MSI (OLE Compound File). */
export class FileSignatureError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FileSignatureError';
	}
}

function isPeMz(buf: Buffer): boolean {
	return buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a;
}

function isOleCompound(buf: Buffer): boolean {
	return (
		buf.length >= 8 &&
		buf[0] === 0xd0 &&
		buf[1] === 0xcf &&
		buf[2] === 0x11 &&
		buf[3] === 0xe0 &&
		buf[4] === 0xa1 &&
		buf[5] === 0xb1 &&
		buf[6] === 0x1a &&
		buf[7] === 0xe1
	);
}

function isZip(buf: Buffer): boolean {
	if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) return false;
	/* Local file header PK\x03\x04 — häufigster Fall; EOCD PK\x05\x06 für leeres ZIP */
	return (buf[2] === 0x03 && buf[3] === 0x04) || (buf[2] === 0x05 && buf[3] === 0x06);
}

/** Pflicht für Hauptinstaller — nur PE oder OLE (MSI). */
export function assertInstallerSignature(buf: Buffer): void {
	if (isPeMz(buf) || isOleCompound(buf)) return;
	throw new FileSignatureError(
		'Setup-Datei: Signatur entspricht keiner gültigen Windows-Installer-Datei (PE oder MSI/OLE).'
	);
}

/**
 * Zusatz-/Support-Dateien: bei typischen Binärerweiterungen Signatur prüfen;
 * andere Erweiterungen unverändert (Skripte, XML, …).
 */
export function assertOptionalUploadedFileSignature(buf: Buffer, originalName: string): void {
	const ext = extname(originalName).toLowerCase();
	if (ext === '.zip') {
		if (!isZip(buf)) {
			throw new FileSignatureError(`Datei „${originalName}“: keine gültige ZIP-Signatur (PK).`);
		}
		return;
	}
	if (ext === '.msi') {
		if (!isOleCompound(buf)) {
			throw new FileSignatureError(`Datei „${originalName}“: keine gültige MSI-Signatur (OLE).`);
		}
		return;
	}
	if (['.exe', '.dll', '.sys', '.cpl'].includes(ext)) {
		if (!isPeMz(buf) && !isOleCompound(buf)) {
			throw new FileSignatureError(`Datei „${originalName}“: erwartet PE (MZ) oder OLE.`);
		}
	}
}
