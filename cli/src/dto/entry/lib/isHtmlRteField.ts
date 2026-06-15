import type { SchemaField } from '#cli/cs/Types.js';
import isRecord from '#cli/util/isRecord.js';

export default function isHtmlRteField(
	schema: SchemaField | undefined,
): schema is SchemaField & {
	readonly data_type: 'text';
	readonly field_metadata: Record<string, unknown> & {
		readonly allow_rich_text: true;
	};
} {
	if (!schema) {
		return false;
	}

	if (schema.data_type !== 'text') {
		return false;
	}

	const metadata = schema.field_metadata;
	if (!isRecord(metadata)) {
		return false;
	}

	return Boolean(metadata.allow_rich_text);
}
