import type { Schema } from '#cli/cs/Types.js';
import traverse from './lib/traverse.js';

export default function fromCs(schemaContainer: Schema): Schema {
	const entries = new Map<string, unknown>();

	for (const [key, value] of Object.entries(schemaContainer)) {
		if (!keysToRemove.has(key)) {
			entries.set(key, value);
		}
	}

	return {
		title: schemaContainer.title,
		uid: schemaContainer.uid,
		...Object.fromEntries(entries),
		schema: [...traverse(schemaContainer.schema)],
	};
}

const keysToRemove = new Set<string>([
	'DEFAULT_ACL',
	'SYS_ACL',
	'_version',
	'abilities',
	'created_at',
	'inbuilt_class',
	'last_activity',
	'maintain_revisions',
	'updated_at',
	'schema',
]);
