import { describe, expect, it } from 'vitest';

import {
	buildEditorPersistFingerprint,
	computeEditorDirty,
	computePersistSaveErrorDisplayed,
	computePersistStatusPresentation,
	isPersistFormValid,
	parsePersistFormDataRaw
} from './script-editor-page.controller';

describe('script-editor-page.controller (pure helpers)', () => {
	it('buildEditorPersistFingerprint ist leer ohne sid', () => {
		expect(buildEditorPersistFingerprint('', 'n', 'v', 's', '{}')).toBe('');
	});

	it('computeEditorDirty nur bei sid und abweichendem Fingerprint', () => {
		const fp = buildEditorPersistFingerprint('1', 'n', 'v', 's', '{}');
		expect(computeEditorDirty('', fp, '')).toBe(false);
		expect(computeEditorDirty('1', fp, fp)).toBe(false);
		expect(computeEditorDirty('1', fp, 'other')).toBe(true);
	});

	it('computePersistSaveErrorDisplayed blendet aus, wenn Fingerprint weicht', () => {
		const fp = buildEditorPersistFingerprint('1', 'n', 'v', 's', '{}');
		expect(
			computePersistSaveErrorDisplayed('oops', fp, buildEditorPersistFingerprint('1', 'n', 'v', 't', '{}'))
		).toBe(null);
		expect(computePersistSaveErrorDisplayed('oops', fp, fp)).toBe('oops');
	});

	it('computePersistStatusPresentation: hidden ohne sid', () => {
		expect(
			computePersistStatusPresentation({
				sid: '',
				detailLoading: false,
				scriptSaveInProgress: false,
				persistSaveErrorDisplayed: null,
				editorDirty: false,
				persistSavedAt: null
			}).mode
		).toBe('hidden');
	});

	it('parsePersistFormDataRaw und isPersistFormValid', () => {
		expect(parsePersistFormDataRaw('{').ok).toBe(false);
		expect(parsePersistFormDataRaw('{"a":1}').ok).toBe(true);
		expect(isPersistFormValid('x', 'y', 'not json')).toBe(false);
		expect(isPersistFormValid('x', 'y', '{}')).toBe(true);
	});
});
