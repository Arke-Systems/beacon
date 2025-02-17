import type { SchemaField } from '#cli/cs/Types.js';
import { isSchemaFields } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import traverse from './traverse.js';

export default function replaceGroup(field: SchemaField): SchemaField {
	const { schema } = field;

	if (!isSchemaFields(schema)) {
		getUi().warn('Invalid group schema', field);
		return field;
	}

	return { ...field, schema: [...traverse(schema)] };
}
