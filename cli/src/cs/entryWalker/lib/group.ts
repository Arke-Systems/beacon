import type { SchemaField } from '#cli/cs/Types.js';
import { isSchemaFields } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import isRecord from '#cli/util/isRecord.js';
import type EntryWalker from '../EntryWalker.js';

export default function group(
	this: EntryWalker,
	field: SchemaField,
	value: unknown,
) {
	if (!isRecord(value)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} contains a group field (${field.uid})`;
		const msg2 = 'with an unexpected data structure:';
		getUi().warn(msg1, msg2, value);
		return value;
	}

	if (!('schema' in field)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} contains a group field (${field.uid})`;
		const msg2 = 'without a schema definition:';
		getUi().warn(msg1, msg2, field);
		return value;
	}

	const { schema } = field;

	if (!isSchemaFields(schema)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} contains a group field (${field.uid})`;
		const msg2 = 'with an invalid schema definition:';
		getUi().warn(msg1, msg2, schema);
		return value;
	}

	const processed = this.node(schema, value);

	if (processed === undefined) {
		return;
	}

	if (!isRecord(processed)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} contains a group field (${field.uid})`;
		const msg2 = 'that was mutated during normalization, but the mutation';
		const msg3 = 'resulted in an unexpected data structure:';
		getUi().warn(msg1, msg2, msg3, processed);
		return value;
	}

	delete processed._metadata;
	return processed;
}
