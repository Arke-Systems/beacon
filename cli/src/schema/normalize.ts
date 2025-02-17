import type { Schema } from '#cli/cs/Types.js';

// Contentstack observed providing differing values for these fields based on
// whether an "import" or a "read" operation was performed:
//
//   - DEFAULT_ACL
//   - SYS_ACL
//
// Last observed: 2024-07-26.
export default function normalize({
	description,
	options,
	schema,
	title,
	uid,
}: Schema) {
	return {
		description,
		options,
		schema: normalizeSchema(schema),
		title,
		uid,
	};
}

function normalizeSchema(schema: unknown): unknown {
	if (schema === undefined) {
		return schema;
	}

	if (Array.isArray(schema)) {
		return schema.map(normalizeSchema);
	}

	if (typeof schema !== 'object' || schema === null) {
		throw new Error('Invalid schema');
	}

	const {
		inbuilt_model,
		indexed,
		schema: nestedSchema,
		...rest
	} = schema as Record<string, unknown>;

	return {
		...rest,
		...(nestedSchema ? { schema: normalizeSchema(nestedSchema) } : {}),
	};
}
