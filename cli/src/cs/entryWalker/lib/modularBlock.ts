import type { ReferencePath } from '#cli/cs/entries/Types.js';
import type { Item } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import isRecord from '#cli/util/isRecord.js';
import type EntryWalker from '../EntryWalker.js';

export default function modularBlock(
	this: EntryWalker,
	blockTypes: ReadonlyMap<string, Item>,
	block: unknown,
	idx: number,
) {
	if (!isRecord(block)) {
		getUi().warn(...unexpectedDataStructure(this.context, idx), block);
		return block;
	}

	const [[blockType, blockValue] = []] = Object.entries(block);
	if (!blockType) {
		getUi().warn(...missingBlockType(this.context, idx), block);
		return block;
	}

	const matchingBlockType = blockTypes.get(blockType);
	if (!matchingBlockType) {
		getUi().warn(...unknownBlockType(this.context, blockType, idx));
		return block;
	}

	if (!isRecord(blockValue)) {
		getUi().warn(
			...unexpectedBlockType(this.context, blockType, idx),
			blockValue,
		);

		return;
	}

	const result =
		this.schemaBlock(matchingBlockType, blockValue) ??
		this.referenceBlock(matchingBlockType, blockValue);

	if (result) {
		const { _metadata, ...rest } = result;
		return { [blockType]: rest };
	}

	getUi().warn(...invalidBlockType(this.context, blockType, idx));
	return block;
}

function unexpectedDataStructure(context: ReferencePath, idx: number) {
	const y = createStylus('yellowBright');
	const msg1 = y`Entry ${context} contains an unexpected modular block`;
	const msg2 = y`data structure at index ${idx.toLocaleString()}:`;
	return [msg1, msg2];
}

function missingBlockType(context: ReferencePath, idx: number) {
	const y = createStylus('yellowBright');
	const msg1 = y`Entry ${context} contains an invalid`;
	const msg2 = y`modular block at index ${idx.toLocaleString()}:`;
	return [msg1, msg2];
}

function unknownBlockType(
	context: ReferencePath,
	blockType: string,
	idx: number,
) {
	const y = createStylus('yellowBright');
	const msg1 = y`Entry ${context} references an unknown`;
	const msg2 = y`modular block type (${blockType})`;
	const msg3 = y`at index ${idx.toLocaleString()}.`;
	return [msg1, msg2, msg3];
}

function unexpectedBlockType(
	context: ReferencePath,
	blockType: string,
	idx: number,
) {
	const y = createStylus('yellowBright');
	const msg1 = y`Entry ${context} references modular block type`;
	const msg2 = y`${blockType} with an unexpected data structure`;
	const msg3 = y`at index ${idx.toLocaleString()}:`;
	return [msg1, msg2, msg3];
}

function invalidBlockType(
	context: ReferencePath,
	blockType: string,
	idx: number,
) {
	const y = createStylus('yellowBright');
	const msg1 = y`Entry ${context} references modular block type`;
	const msg2 = y`${blockType} with an invalid schema at index`;
	const msg3 = y`${idx.toLocaleString()}.`;
	return [msg1, msg2, msg3];
}
