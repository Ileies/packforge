<script lang="ts">
	import { onMount } from 'svelte';

	import { beforeNavigate, goto } from '$app/navigation';
	import { APP_PAGE_SHELL_CLASS } from '$lib/app/app-page-shell';
	import { PRODUCT_NAME } from '$lib/app/brand';
	import { type ApiErrorSurface, fromJsonErr, msgErr } from '$lib/client/api-error-present';
	import { apiJson, authHeaders, parseFailedResponse } from '$lib/client/api-fetch';
	import { apiRoutes } from '$lib/client/api-routes';
	import { buildImportBody, nextSelectableIdAfterDelete } from '$lib/client/data-editor-helpers';
	import { safeJson } from '$lib/client/data-editor-logic';
	import type { Row } from '$lib/client/data-editor-types';
	import {
		confirmDirtyInAppNavigationAsync,
		DIRTY_NAVIGATION_WARNING_DE,
		handleDirtyBeforeUnload
	} from '$lib/client/dirty-navigation-guard';
	import { pushSuccessToast } from '$lib/client/success-toast';
	import ConfirmAlertDialog from '$lib/components/confirm-alert-dialog.svelte';
	import ContextBreadcrumb from '$lib/components/context-breadcrumb.svelte';
	import DataEditorEditPanel from '$lib/components/data-editor-edit-panel.svelte';
	import DataEditorFieldsTablePanel from '$lib/components/data-editor-fields-table-panel.svelte';
	import { assertJsonFileWithinLimit } from '$lib/shared/json-limit';

	let rows = $state<Row[]>([]);
	let selected = $state<Row | null>(null);
	let err = $state<ApiErrorSurface | null>(null);
	let saving = $state(false);
	let initialLoading = $state(true);

	let editName = $state('');
	let editLabel = $state('');
	let editRequired = $state(false);
	let editValidation = $state('');
	let editInfo = $state('');
	let editDefaultValue = $state('');
	let editAutofillSource = $state('');
	let editFieldScope = $state('both');
	let editIsDropdown = $state(false);
	let editDropdownValues = $state('');
	let editPredefinedvalues = $state(false);
	let editPredefinedvaluesMap = $state('');
	let editIsInstallerDropdown = $state(false);
	let editIsReadonly = $state(false);
	let editBaselineFingerprint = $state('');

	let deleteFieldOpen = $state(false);
	let deleteFieldPending = $state<Row | null>(null);

	function sortRowsStable(list: Row[]): Row[] {
		return [...list].sort((a, b) => {
			const oa = a.sort_order ?? 0;
			const ob = b.sort_order ?? 0;
			if (oa !== ob) return oa - ob;
			return a.id - b.id;
		});
	}

	function pick(r: Row) {
		if (r.is_system_field) return;
		selected = r;
		editName = r.name;
		editLabel = r.label;
		editRequired = r.required;
		editValidation = r.validation ?? '';
		editInfo = r.info ?? '';
		editDefaultValue = r.default_value ?? '';
		editAutofillSource = r.autofill_source ?? '';
		editFieldScope = r.field_scope || 'both';
		editIsDropdown = r.is_dropdown;
		editDropdownValues = r.dropdown_values ?? '';
		editPredefinedvalues = r.predefinedvalues;
		editPredefinedvaluesMap = r.predefinedvalues_map ?? '';
		editIsInstallerDropdown = r.is_installer_dropdown;
		editIsReadonly = r.is_readonly;
		editBaselineFingerprint = editFingerprintNow();
	}

	function reorderDrag(fromId: number, toId: number) {
		if (fromId === toId) return;
		const copy = [...rows];
		const fromIdx = copy.findIndex((x) => x.id === fromId);
		let toIdx = copy.findIndex((x) => x.id === toId);
		if (fromIdx < 0 || toIdx < 0) return;
		if (copy[fromIdx].is_system_field || copy[toIdx].is_system_field) return;
		const rollbackSnapshot = rows.map((r) => ({ ...r }));
		const [item] = copy.splice(fromIdx, 1);
		if (fromIdx < toIdx) toIdx--;
		copy.splice(toIdx, 0, item);
		rows = copy;
		void saveListOrder(rollbackSnapshot);
	}

	async function load() {
		err = null;
		try {
			const r = await apiJson<Row[]>(apiRoutes.formfields.list, { headers: authHeaders() });
			if (!r.ok) {
				err = fromJsonErr(r);
				return;
			}
			rows = r.data;
			const cur = selected;
			if (cur) {
				const u = rows.find((x) => x.id === cur.id);
				if (!u || u.is_system_field) {
					selected = null;
					editBaselineFingerprint = '';
				} else pick(u);
			} else {
				editBaselineFingerprint = '';
			}
		} finally {
			initialLoading = false;
		}
	}

	function rowFromEdits(sel: Row): Row {
		return {
			...sel,
			name: editName,
			label: editLabel,
			required: editRequired,
			validation: editValidation || null,
			predefinedvalues: editPredefinedvalues,
			predefinedvalues_map: editPredefinedvaluesMap.trim().length ? editPredefinedvaluesMap : null,
			autofill_source: editAutofillSource || null,
			is_installer_dropdown: editIsInstallerDropdown,
			is_readonly: editIsReadonly,
			info: editInfo || null,
			default_value: editDefaultValue || null,
			is_dropdown: editIsDropdown,
			dropdown_values: editDropdownValues.trim().length ? editDropdownValues : null,
			field_scope: editFieldScope || 'both'
		};
	}

	async function save() {
		if (!selected || selected.is_system_field || selected.is_spacer) return;
		const id = selected.id;
		const body = {
			name: editName,
			label: editLabel,
			required: editRequired,
			validation: editValidation,
			predefinedvalues: editPredefinedvalues,
			predefinedvaluesMap: safeJson(editPredefinedvaluesMap),
			autofillSource: editAutofillSource || null,
			isInstallerDropdown: editIsInstallerDropdown,
			isReadonly: editIsReadonly,
			info: editInfo || null,
			defaultValue: editDefaultValue || null,
			isDropdown: editIsDropdown,
			dropdownValues: safeJson(editDropdownValues),
			fieldScope: editFieldScope || 'both'
		};
		const optimisticRow = rowFromEdits(selected);
		const rowsBackup = rows.map((r) => ({ ...r }));
		const selectedBackup: Row = { ...selected };

		rows = rows.map((r) => (r.id === id ? { ...optimisticRow } : r));
		selected = { ...optimisticRow };

		saving = true;
		err = null;
		const r = await apiJson(apiRoutes.formfields.detail(id), {
			method: 'PUT',
			jsonBody: body
		});
		saving = false;
		if (!r.ok) {
			rows = rowsBackup;
			selected = { ...selectedBackup };
			pick(selectedBackup);
			err = fromJsonErr(r);
			return;
		}
		editBaselineFingerprint = editFingerprintNow();
		pushSuccessToast('Gespeichert.');
	}

	async function executeDeleteRow(row: Row): Promise<boolean> {
		const deletedIndex = rows.findIndex((x) => x.id === row.id);
		const selectAfterId = deletedIndex >= 0 ? nextSelectableIdAfterDelete(rows, deletedIndex) : null;

		saving = true;
		err = null;
		const r = await apiJson(apiRoutes.formfields.detail(row.id), {
			method: 'DELETE',
			headers: authHeaders()
		});
		saving = false;
		if (!r.ok) {
			err = fromJsonErr(r);
			return false;
		}
		rows = rows.filter((x) => x.id !== row.id);
		selected = null;
		if (selectAfterId != null) {
			const nr = rows.find((x) => x.id === selectAfterId);
			if (nr) pick(nr);
		}
		return true;
	}

	function requestDeleteField() {
		if (!selected || selected.is_system_field) return;
		if (selected.is_spacer) {
			void executeDeleteRow(selected);
			return;
		}
		deleteFieldPending = selected;
		deleteFieldOpen = true;
	}

	async function confirmDeleteField(): Promise<boolean> {
		const row = deleteFieldPending;
		if (!row) return true;
		const ok = await executeDeleteRow(row);
		if (ok) deleteFieldPending = null;
		return ok;
	}

	async function exportJson() {
		err = null;
		const r = await fetch(apiRoutes.formfields.export, { headers: authHeaders() });
		if (!r.ok) {
			err = await parseFailedResponse(r);
			return;
		}
		const blob = await r.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'formfields-export.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	async function onImportFile(ev: Event) {
		const input = ev.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		input.value = '';
		if (!f) return;
		err = null;
		let parsed: unknown;
		try {
			assertJsonFileWithinLimit(f.size);
			parsed = JSON.parse(await f.text());
		} catch (e) {
			if (e instanceof Error && /zu groß/i.test(e.message)) {
				err = msgErr(e.message);
				return;
			}
			err = msgErr('Import-Datei ist kein gültiges JSON.');
			return;
		}

		const body = buildImportBody(parsed);
		if (!body) {
			err = msgErr('JSON braucht ein Array von Feldern oder { formfields: [...] }.');
			return;
		}

		saving = true;
		const r = await apiJson(apiRoutes.formfields.import, {
			method: 'POST',
			jsonBody: body
		});
		saving = false;
		if (!r.ok) {
			err = fromJsonErr(r);
			return;
		}
		await load();
	}

	async function saveListOrder(
		rollbackSnapshot: Row[] | null = null,
		opts: { skipUndoToast?: boolean } = {}
	) {
		if (!rows.length) return;
		saving = true;
		err = null;
		const orderedIds = rows.map((r) => r.id);
		const r = await apiJson(apiRoutes.formfields.reorder, {
			method: 'POST',
			jsonBody: { orderedIds }
		});
		saving = false;
		if (!r.ok) {
			err = fromJsonErr(r);
			if (rollbackSnapshot?.length) {
				rows = rollbackSnapshot.map((x) => ({ ...x }));
			} else {
				await load();
			}
			return;
		}
		rows = rows.map((row, index) => ({ ...row, sort_order: index }));
		if (!opts.skipUndoToast && rollbackSnapshot?.length) {
			const previous = rollbackSnapshot.map((x) => ({ ...x }));
			pushSuccessToast('Reihenfolge gespeichert.', {
				onUndo: async () => {
					rows = previous.map((x) => ({ ...x }));
					await saveListOrder(null, { skipUndoToast: true });
				}
			});
		}
	}

	async function addSpacer() {
		saving = true;
		err = null;
		const r = await apiJson<{ success?: boolean; id?: unknown }>(apiRoutes.formfields.list, {
			method: 'POST',
			jsonBody: { isSpacer: true }
		});
		saving = false;
		if (!r.ok) {
			err = fromJsonErr(r);
			return;
		}
		const newId = Number(r.data.id);
		if (Number.isFinite(newId) && newId > 0) {
			const detail = await apiJson<Row>(apiRoutes.formfields.detail(newId), { headers: authHeaders() });
			if (!detail.ok) {
				err = fromJsonErr(detail);
				await load();
				return;
			}
			rows = sortRowsStable([...rows, detail.data]);
			pick(detail.data);
			pushSuccessToast('Abstandhalter eingefügt.', {
				undoLabel: 'Entfernen',
				onUndo: async () => {
					saving = true;
					err = null;
					const dr = await apiJson(apiRoutes.formfields.detail(newId), {
						method: 'DELETE',
						headers: authHeaders()
					});
					saving = false;
					if (!dr.ok) {
						err = fromJsonErr(dr);
						return;
					}
					rows = rows.filter((x) => x.id !== newId);
					if (selected?.id === newId) {
						selected = null;
						editBaselineFingerprint = '';
					}
				}
			});
		}
	}

	onMount(load);

	let skipDirtyNextNav = false;

	$effect(() => {
		if (typeof window === 'undefined') return;
		const onBeforeUnload = (event: BeforeUnloadEvent) => handleDirtyBeforeUnload(event, editDirty);
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	});

	beforeNavigate((navigation) => {
		if (navigation.willUnload) return;
		if (skipDirtyNextNav) {
			skipDirtyNextNav = false;
			return;
		}
		if (!editDirty) return;
		const to = navigation.to;
		navigation.cancel();
		void confirmDirtyInAppNavigationAsync(true, DIRTY_NAVIGATION_WARNING_DE).then((leave) => {
			if (leave && to) {
				skipDirtyNextNav = true;
				void goto(to.url);
			}
		});
	});

	const dataEditorBreadcrumbs = $derived.by(() => {
		const crumbs: { label: string }[] = [{ label: 'Daten-Editor' }];
		const s = selected;
		if (!s || s.is_system_field) return crumbs;
		if (s.is_spacer) return [...crumbs, { label: 'Abstandhalter' }];
		const leaf = (s.label || s.name || 'Feld').trim();
		return [...crumbs, { label: leaf }];
	});

	const dataEditorDocTitle = $derived.by(() => {
		const s = selected;
		if (!s || s.is_system_field) return 'Daten-Editor';
		if (s.is_spacer) return 'Abstandhalter — Daten-Editor';
		const leaf = (s.label || s.name || 'Feld').trim();
		return `${leaf} — Daten-Editor`;
	});

	const editFingerprint = $derived(editFingerprintNow());
	const editDirty = $derived(editFingerprint !== editBaselineFingerprint);

	function editFingerprintNow(): string {
		if (!selected || selected.is_system_field || selected.is_spacer) return '';
		return JSON.stringify({
			id: selected.id,
			name: editName,
			label: editLabel,
			required: editRequired,
			validation: editValidation,
			info: editInfo,
			defaultValue: editDefaultValue,
			autofillSource: editAutofillSource,
			fieldScope: editFieldScope,
			isDropdown: editIsDropdown,
			dropdownValues: editDropdownValues,
			predefinedvalues: editPredefinedvalues,
			predefinedvaluesMap: editPredefinedvaluesMap,
			isInstallerDropdown: editIsInstallerDropdown,
			isReadonly: editIsReadonly
		});
	}
</script>

<svelte:head>
	<title>{dataEditorDocTitle} — {PRODUCT_NAME}</title>
</svelte:head>

<div class="{APP_PAGE_SHELL_CLASS} space-y-3">
	<ContextBreadcrumb items={dataEditorBreadcrumbs} class="max-w-full" />
	{#if deleteFieldPending}
		<ConfirmAlertDialog
			bind:open={deleteFieldOpen}
			title="Formularfeld löschen?"
			description="Das Feld „{deleteFieldPending.label}“ ({deleteFieldPending.name}) wird dauerhaft entfernt."
			confirmLabel="Endgültig löschen"
			cancelLabel="Abbrechen"
			confirmDisabled={saving}
			onconfirm={confirmDeleteField}
		/>
	{/if}

	<div class="grid gap-6 lg:grid-cols-2 lg:items-start">
		<DataEditorFieldsTablePanel
			{rows}
			selectedId={selected?.id ?? null}
			{err}
			{saving}
			{initialLoading}
			onPick={pick}
			onReorder={reorderDrag}
			onExportJson={exportJson}
			{onImportFile}
			onSaveListOrder={saveListOrder}
			onAddSpacer={addSpacer}
		/>

		<DataEditorEditPanel
			{selected}
			{saving}
			bind:editName
			bind:editLabel
			bind:editRequired
			bind:editValidation
			bind:editInfo
			bind:editDefaultValue
			bind:editAutofillSource
			bind:editFieldScope
			bind:editIsDropdown
			bind:editDropdownValues
			bind:editPredefinedvalues
			bind:editPredefinedvaluesMap
			bind:editIsInstallerDropdown
			bind:editIsReadonly
			onSave={save}
			onRequestDeleteField={requestDeleteField}
		/>
	</div>
</div>
