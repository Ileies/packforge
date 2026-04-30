const INSTALLER_TYPES = [
	'Custom',
	'Advanced Installer Bootstrapper',
	'Dell DUP',
	'INNO Setup',
	'InstallForge',
	'InstallShield',
	'InstallShield MSI',
	'Microsoft Standard EXE Installer',
	'MSI',
	'NSIS',
	'Wise Installation System',
	'WiX Setup'
];

function createInstallerTypesMap(): Record<string, string> {
	const map: Record<string, string> = {};
	for (const type of INSTALLER_TYPES) map[type] = type;
	return map;
}

export type SystemFieldSeed = {
	name: string;
	label: string;
	autofill_source: string | null;
	required: boolean;
	validation: string;
	predefinedvalues: boolean;
	predefinedvalues_map: string | null;
	is_installer_dropdown: boolean;
	is_readonly: boolean;
	show_in_library: boolean;
	default_value: string;
	info: string;
	sort_order: number;
};

export function getSystemFields(): SystemFieldSeed[] {
	return [
		{
			name: 'Installer',
			label: 'AppInstallType',
			autofill_source: 'DetectedInstaller',
			required: true,
			validation: '',
			predefinedvalues: true,
			predefinedvalues_map: JSON.stringify(createInstallerTypesMap()),
			is_installer_dropdown: true,
			is_readonly: false,
			show_in_library: true,
			default_value: '',
			info: 'Installertyp (z. B. MSI, NSIS)',
			sort_order: 1
		},
		{
			name: 'Name',
			label: 'AppName',
			autofill_source: 'ProductName',
			required: true,
			validation: '',
			predefinedvalues: false,
			predefinedvalues_map: null,
			is_installer_dropdown: false,
			is_readonly: false,
			show_in_library: false,
			default_value: '',
			info: 'DisplayName',
			sort_order: 2
		},
		{
			name: 'Vendor',
			label: 'AppVendor',
			autofill_source: 'CompanyName',
			required: true,
			validation: '',
			predefinedvalues: false,
			predefinedvalues_map: null,
			is_installer_dropdown: false,
			is_readonly: false,
			show_in_library: false,
			default_value: '',
			info: 'Publisher',
			sort_order: 3
		},
		{
			name: 'Version',
			label: 'AppVersion',
			autofill_source: 'ProductVersion',
			required: true,
			validation: '',
			predefinedvalues: false,
			predefinedvalues_map: null,
			is_installer_dropdown: false,
			is_readonly: false,
			show_in_library: false,
			default_value: '',
			info: 'DisplayVersion',
			sort_order: 4
		},
		{
			name: 'Script Author',
			label: 'AppScriptAuthor',
			autofill_source: null,
			required: true,
			validation: '',
			predefinedvalues: false,
			predefinedvalues_map: null,
			is_installer_dropdown: false,
			is_readonly: true,
			show_in_library: true,
			default_value: '',
			info: '',
			sort_order: 5
		},
		{
			name: 'Creation Date',
			label: 'AppScriptDate',
			autofill_source: null,
			required: true,
			validation: '',
			predefinedvalues: false,
			predefinedvalues_map: null,
			is_installer_dropdown: false,
			is_readonly: true,
			show_in_library: true,
			default_value: '',
			info: '',
			sort_order: 6
		},
		{
			name: 'Script Version',
			label: 'AppScriptVersion',
			autofill_source: null,
			required: true,
			validation: '',
			predefinedvalues: false,
			predefinedvalues_map: null,
			is_installer_dropdown: false,
			is_readonly: true,
			show_in_library: true,
			default_value: '',
			info: '',
			sort_order: 7
		}
	];
}
