import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '../../../ui/createStylus.js';
import type { SchemaFields } from '../../Types.js';
import type EntryWalker from '../EntryWalker.js';

export default function node(
	this: EntryWalker,
	schema: SchemaFields,
	container: Record<string, unknown>,
) {
	const entries = Object.entries(container);
	if (entries.length === 0) {
		return container;
	}

	const properties = new Map<string, unknown>();

	for (const [fieldUid, value] of entries) {
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

	return properties.size ? Object.fromEntries(properties) : undefined;
}
