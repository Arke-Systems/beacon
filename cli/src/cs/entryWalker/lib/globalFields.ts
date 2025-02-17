import type { Schema, SchemaField } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import isRecord from '#cli/util/isRecord.js';
import type EntryWalker from '../EntryWalker.js';

export default function globalFields(
	this: EntryWalker,
	field: SchemaField,
	value: unknown,
) {
	const { reference_to: referenceTo } = field;

	if (typeof referenceTo !== 'string') {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} contains an unexpected global`;
		const msg2 = 'field reference. Expected to find the global field UID,';
		const msg3 = y`but found: ${typeof referenceTo}.`;
		getUi().warn(msg1, msg2, msg3);
		return value;
	}

	const globalField = this.globalFieldsByUid.get(referenceTo);

	if (!globalField) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} references a global field named`;
		const msg2 = y`${referenceTo}, which does not exist.`;
		getUi().warn(msg1, msg2);
		return value;
	}

	if (!Array.isArray(value)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} contains a reference to`;
		const msg2 = y`global field ${globalField.uid}. Expected the value`;
		const msg3 = y`to be an array of groups, but found: ${typeof value}.`;
		getUi().warn(msg1, msg2, msg3);
		return value;
	}

	return value.map(processGlobalField.bind(this, globalField)).filter(Boolean);
}

function processGlobalField(
	this: EntryWalker,
	globalField: Schema,
	value: unknown,
	idx: number,
) {
	if (!isRecord(value)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} references global field`;
		const msg2 = y`${globalField.uid}, which contains an unexpected data`;
		const msg3 = y`structure at index ${idx.toLocaleString()}:`;
		getUi().warn(msg1, msg2, msg3, value);
		return value;
	}

	const processed = this.node(globalField.schema, value);
	if (processed === undefined) {
		return;
	}

	if (!isRecord(processed)) {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.context} references global field`;
		const msg2 = y`${globalField.uid} that supports multiple values.`;
		const msg3 = y`The value at index ${idx.toLocaleString()} was mutated`;
		const msg4 = 'while normalizing the data structure, but the mutation';
		const msg5 = 'resulted in an invalid global field value:';
		getUi().warn(msg1, msg2, msg3, msg4, msg5, processed);
		return value;
	}

	delete processed._metadata;
	return processed;
}
