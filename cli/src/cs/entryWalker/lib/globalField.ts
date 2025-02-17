import type { SchemaField } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import isRecord from '#cli/util/isRecord.js';
import type EntryWalker from '../EntryWalker.js';

export default function globalField(
	this: EntryWalker,
	field: SchemaField,
	value: unknown,
) {
	if (!isRecord(value)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} contains an unexpected global field`;
		const msg2 = 'data structure:';
		getUi().warn(msg1, msg2, value);
		return value;
	}

	const { reference_to: referenceTo } = field;

	if (typeof referenceTo !== 'string') {
		const y = createStylus('yellowBright');
		const msg = y`Entry ${this.context} references invalid global field:`;
		getUi().warn(msg, field);
		return value;
	}

	const match = this.globalFieldsByUid.get(referenceTo);

	if (!match) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} references a global field named`;
		const msg2 = y`${referenceTo}, which does not exist.`;
		getUi().warn(msg1, msg2);
		return value;
	}

	const { schema } = match;
	return this.node(schema, value);
}
