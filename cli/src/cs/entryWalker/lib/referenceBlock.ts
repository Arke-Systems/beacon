import type { Item } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import type EntryWalker from '../EntryWalker.js';

export default function referenceBlock(
	this: EntryWalker,
	blockType: Item,
	block: Record<string, unknown>,
) {
	const { reference_to: globalFieldUid } = blockType;

	if (!globalFieldUid) {
		return;
	}

	if (typeof globalFieldUid !== 'string') {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} references modular block type`;
		const msg2 = y`${blockType.uid} with an invalid global field reference:`;
		getUi().warn(msg1, msg2, globalFieldUid);
		return block;
	}

	const globalField = this.globalFieldsByUid.get(globalFieldUid);

	if (!globalField) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} references a global field named`;
		const msg2 = y`${globalFieldUid}, which does not exist.`;
		getUi().warn(msg1, msg2);
		return block;
	}

	return this.node(globalField.schema, block);
}
