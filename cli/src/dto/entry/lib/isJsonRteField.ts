import type { SchemaField } from '#cli/cs/Types.js';
import isRecord from '#cli/util/isRecord.js';

export default function isJsonRteField(schema: SchemaField) {
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
