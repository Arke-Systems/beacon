import { type Item, isSchemaFields } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import type EntryWalker from '../EntryWalker.js';

export default function schemaBlock(
	this: EntryWalker,
	blockType: Item,
	block: Record<string, unknown>,
) {
	const { schema } = blockType;
	if (!schema) {
		return;
	}

	if (!isSchemaFields(schema)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} references modular block type`;
		const msg2 = y`${blockType.uid} with an invalid schema:`;
		getUi().warn(msg1, msg2, schema);
		return block;
	}

	return this.node(schema, block);
}
