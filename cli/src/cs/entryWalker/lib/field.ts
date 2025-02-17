import type { SchemaField } from '#cli/cs/Types.js';
import type EntryWalker from '../EntryWalker.js';

export default function field(
	this: EntryWalker,
	schema: SchemaField,
	value: unknown,
) {
	const mutated = this.callback(schema, value);
	if (mutated === undefined) {
		return;
	}

	switch (schema.data_type) {
		case 'blocks':
			return this.modularBlocks(schema, mutated);

		case 'global_field':
			return schema.multiple === true
				? this.globalFields(schema, mutated)
				: this.globalField(schema, mutated);

		case 'group':
			return schema.multiple === true
				? this.groups(schema, mutated)
				: this.group(schema, mutated);

		default:
			return mutated;
	}
}
