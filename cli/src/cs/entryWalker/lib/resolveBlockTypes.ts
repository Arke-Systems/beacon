import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import type { Item, SchemaField } from '../../Types.js';
import { isItem } from '../../Types.js';
import type EntryWalker from '../EntryWalker.js';

export default function resolveBlockTypes(
	this: EntryWalker,
	field: SchemaField,
): ReadonlyMap<string, Item> | undefined {
	if (!('blocks' in field)) {
		const y = createStylus('yellowBright');
		const msg1 = 'Failed to locate a modular blocks definition';
		const msg2 = y`in entry ${this.context}:`;
		getUi().warn(msg1, msg2, field);
		return;
	}

	const { blocks: blockTypesArray } = field;
	if (!Array.isArray(blockTypesArray) || !blockTypesArray.every(isItem)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} contains an invalid modular`;
		const msg2 = 'blocks schema:';
		getUi().warn(msg1, msg2, field);
		return;
	}

	return blockTypesArray.reduce(
		(map, item) => map.set(item.uid, item),
		new Map<string, Item>(),
	);
}
