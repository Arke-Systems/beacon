import type { SchemaField } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import type EntryWalker from '../EntryWalker.js';

export default function groups(
	this: EntryWalker,
	field: SchemaField,
	value: unknown,
) {
	if (!Array.isArray(value)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} contains an group[multiple=true]`;
		const msg2 = y`field named ${field.uid}, whose value is not an array:`;
		getUi().warn(msg1, msg2, value);
		return value;
	}

	return value.map(this.group.bind(this, field));
}
