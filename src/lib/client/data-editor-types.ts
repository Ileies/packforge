export type Row = {
	id: number;
	name: string;
	label: string;
	required: boolean;
	validation: string | null;
	predefinedvalues: boolean;
	predefinedvalues_map: string | null;
	autofill_source: string | null;
	is_installer_dropdown: boolean;
	is_readonly: boolean;
	is_spacer: boolean;
	is_system_field: boolean;
	is_dropdown: boolean;
	dropdown_values: string | null;
	default_value: string | null;
	field_scope: string | null;
	info: string | null;
	/** Aus der API; für lokale Sortierung nach Spacer-Einfügen/Reorder. */
	sort_order?: number;
	show_in_library?: boolean;
};
