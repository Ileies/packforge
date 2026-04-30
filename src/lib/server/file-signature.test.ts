import { describe, expect, it } from 'vitest';

import {
	assertInstallerSignature,
	assertOptionalUploadedFileSignature,
	FileSignatureError
} from './file-signature';

describe('file-signature', () => {
	it('PE .exe akzeptiert MZ', () => {
		const buf = Buffer.alloc(64);
		buf[0] = 0x4d;
		buf[1] = 0x5a;
		expect(() => assertInstallerSignature(buf)).not.toThrow();
	});

	it('MSI OLE akzeptiert', () => {
		const buf = Buffer.alloc(64);
		buf[0] = 0xd0;
		buf[1] = 0xcf;
		buf[2] = 0x11;
		buf[3] = 0xe0;
		buf[4] = 0xa1;
		buf[5] = 0xb1;
		buf[6] = 0x1a;
		buf[7] = 0xe1;
		expect(() => assertInstallerSignature(buf)).not.toThrow();
	});

	it('falsche Signatur verworfen', () => {
		const buf = Buffer.from('hello');
		expect(() => assertInstallerSignature(buf)).toThrow(FileSignatureError);
	});

	it('ZIP nach Signatur', () => {
		const buf = Buffer.alloc(32);
		buf[0] = 0x50;
		buf[1] = 0x4b;
		buf[2] = 0x03;
		buf[3] = 0x04;
		expect(() => assertOptionalUploadedFileSignature(buf, 'x.zip')).not.toThrow();
	});
});
