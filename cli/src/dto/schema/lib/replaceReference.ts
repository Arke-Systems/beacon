import type { SchemaField } from '#cli/cs/Types.js';

export default function replaceReference(field: SchemaField): SchemaField {
	const { reference_to } = field;

	if (!Array.isArray(reference_to)) {
		return field;
	}

	return {
		...field,
		reference_to: [...new Set(reference_to)].sort(),
	};
}
