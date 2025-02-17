import type { SchemaField } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import type EntryWalker from '../EntryWalker.js';

export default function modularBlocks(
	this: EntryWalker,
	field: SchemaField,
	value: unknown,
) {
	const blockTypes = this.resolveBlockTypes(field);
	if (!blockTypes) {
		// resolveBlockTypes has multiple reasons for possible failure and is
		// responsible for its own logging.
		return value;
	}

	if (!Array.isArray(value)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Expected modular blocks in entry ${this.context}`;
		const msg2 = y`to be an array, but found [${typeof value}]:`;
		getUi().warn(msg1, msg2, value);
		return value;
	}

	return value.map(this.modularBlock.bind(this, blockTypes));
}
