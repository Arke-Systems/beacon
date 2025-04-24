import type { SchemaField } from '#cli/cs/Types.js';
import isRecord from '#cli/util/isRecord.js';

export default function isJsonRteField(
	schema: SchemaField | undefined,
): schema is SchemaField & {
	readonly data_type: 'json';
	readonly field_metadata: Record<string, unknown> & {
		readonly allow_json_rte: true;
	};
} {
	if (!schema) {
		return false;
	}

	if (schema.data_type !== 'json') {
		return false;
	}

	if ('extension_uid' in schema) {
		return false;
	}

	const metadata = schema.field_metadata;
	if (!isRecord(metadata)) {
		return false;
	}

	return Boolean(metadata.allow_json_rte);
}
