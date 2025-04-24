import type { ContentType } from '#cli/cs/content-types/Types.js';
import EntryWalker from '#cli/cs/entryWalker/EntryWalker.js';
import type { Schema, SchemaField } from '#cli/cs/Types.js';
import isJsonRteField from '#cli/dto/entry/lib/isJsonRteField.js';
import isRecord from '#cli/util/isRecord.js';
import type { Entry, ReferencePath } from '../Types.js';
import isEmptyJsonRTEValue from './isEmptyJsonRTEValue.js';

export default function removeEmptyJsonRTEs(
	globalFieldsByUid: ReadonlyMap<Schema['uid'], Schema>,
	contentType: ContentType,
	x: Entry,
) {
	const context: ReferencePath = `${contentType.uid}/${x.title}`;
	const walker = new EntryWalker(globalFieldsByUid, context, remove);
	return walker.process(contentType.schema, x);
}

function remove(field: SchemaField, value: unknown) {
	if (!isJsonRteField(field)) {
		return value;
	}

	if (!isRecord(value)) {
		return value;
	}

	if (isEmptyJsonRTEValue(value)) {
		return;
	}

	return value;
}
