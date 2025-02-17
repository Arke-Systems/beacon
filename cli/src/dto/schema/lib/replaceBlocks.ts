import type { Item, SchemaField } from '#cli/cs/Types.js';
import { isItem, isSchemaFields } from '#cli/cs/Types.js';
import getUi from '../../../schema/lib/SchemaUi.js';
import traverse from './traverse.js';

export default function replaceBlocks(field: SchemaField): SchemaField {
	if (!('blocks' in field)) {
		getUi().warn('Missing blocks schema', field);
		return field;
	}

	const { blocks: blockTypesArray } = field;
	if (!Array.isArray(blockTypesArray) || !blockTypesArray.every(isItem)) {
		getUi().warn('Invalid blocks schema', field);
		return field;
	}

	return {
		...field,
		blocks: blockTypesArray.map((block) => replaceBlock(block)),
	};
}

function replaceBlock(block: Item): Item {
	const { reference_to: globalFieldUid } = block;
	if (typeof globalFieldUid === 'string') {
		return block;
	}

	const { schema } = block;
	if (!isSchemaFields(schema)) {
		getUi().warn('Invalid block schema', block);
		return block;
	}

	return { ...block, schema: [...traverse(schema)] };
}
