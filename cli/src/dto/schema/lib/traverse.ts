import type { SchemaField, SchemaFields } from '#cli/cs/Types.js';
import replaceBlocks from './replaceBlocks.js';
import replaceField from './replaceField.js';
import replaceGroup from './replaceGroup.js';

export default function* traverse(
	schemaFields: SchemaFields,
): Generator<SchemaField> {
	for (const field of schemaFields) {
		switch (field.data_type) {
			case 'blocks':
				yield replaceBlocks(field);
				continue;
			case 'group':
				yield replaceGroup(field);
				continue;
			default:
				yield replaceField(field);
				continue;
		}
	}
}
