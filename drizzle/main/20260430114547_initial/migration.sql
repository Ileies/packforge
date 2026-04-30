CREATE TABLE `ai_daily_usage` (
	`day` text PRIMARY KEY,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`key_hash` text NOT NULL UNIQUE,
	`key_prefix` text NOT NULL,
	`label` text,
	`expires_at` text,
	`scopes_json` text NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`revoked_at` text,
	`last_used_at` text
);
--> statement-breakpoint
CREATE TABLE `formfields` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`label` text NOT NULL UNIQUE,
	`required` integer DEFAULT false NOT NULL,
	`validation` text,
	`predefinedvalues` integer DEFAULT false NOT NULL,
	`predefinedvalues_map` text,
	`autofill_source` text,
	`is_installer_dropdown` integer DEFAULT false NOT NULL,
	`is_system_field` integer DEFAULT false NOT NULL,
	`is_readonly` integer DEFAULT false NOT NULL,
	`show_in_library` integer DEFAULT true NOT NULL,
	`is_spacer` integer DEFAULT false NOT NULL,
	`is_dropdown` integer DEFAULT false NOT NULL,
	`dropdown_values` text,
	`default_value` text,
	`field_scope` text DEFAULT 'both',
	`sort_order` integer DEFAULT 0,
	`info` text,
	`created_at` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE TABLE `script_checkpoints` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`software_id` integer NOT NULL,
	`checkpoint_number` integer NOT NULL,
	`name` text,
	`generated_script` text NOT NULL,
	`comment` text,
	`author` text,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	CONSTRAINT `fk_script_checkpoints_software_id_software_id_fk` FOREIGN KEY (`software_id`) REFERENCES `software`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `software` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`version` text,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`installer_sha256` text,
	`file_size` integer,
	`form_data` text,
	`generated_script` text NOT NULL,
	`template_id` integer,
	`additional_files` text,
	`support_files` text,
	`created_at` text DEFAULT (datetime('now', 'localtime')),
	`updated_at` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`content` text NOT NULL,
	`major_version` integer DEFAULT 1 NOT NULL,
	`minor_version` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE INDEX `idx_api_keys_active` ON `api_keys` (`revoked_at`);--> statement-breakpoint
CREATE INDEX `idx_checkpoints_software_id` ON `script_checkpoints` (`software_id`);--> statement-breakpoint
CREATE INDEX `idx_checkpoints_number` ON `script_checkpoints` (`software_id`,`checkpoint_number`);--> statement-breakpoint
CREATE INDEX `idx_software_created_at` ON `software` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_software_name_version` ON `software` (`name`,`version`);--> statement-breakpoint
CREATE INDEX `idx_templates_created_at` ON `templates` (`created_at`);