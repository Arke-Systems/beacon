import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '../../../ui/createStylus.js';
import type { SchemaFields } from '../../Types.js';
import type EntryWalker from '../EntryWalker.js';

export default function node(
	this: EntryWalker,
	schema: SchemaFields,
	container: Record<string, unknown>,
) {
	const kvp = Object.entries(container);
	if (kvp.length === 0) {
		return container;
	}

	const properties = new Map<string, unknown>();
	const seen = new Set<string>();

	for (const [fieldUid, value] of kvp) {
		seen.add(fieldUid);

		if (fieldUid === '_metadata') {
			properties.set(fieldUid, value);
			continue;
		}

		const field = schema.find((f) => f.uid === fieldUid);
		if (!field) {
			const y = createStylus('yellowBright');
			const msg1 = y`Entry ${this.context} contains a field named`;
			const msg2 = y`${fieldUid} which is not defined in the schema.`;
			getUi().warn(msg1, msg2);
			properties.set(fieldUid, value);
			continue;
		}

		const processed = this.field(field, value);

		if (processed !== undefined) {
			properties.set(fieldUid, processed);
		}
	}

	for (const field of schema) {
		if (seen.has(field.uid)) {
			continue;
		}

		const processed = this.field(field, undefined);
		if (processed !== undefined) {
			properties.set(field.uid, processed);
		}
	}

	return properties.size ? Object.fromEntries(properties) : undefined;
}
