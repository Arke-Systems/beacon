import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { SchemaFields } from '#cli/cs/Types.js';
import isRecord from '#cli/util/isRecord.js';

export default function reduceToShim({
	schema: originalSchema,
	field_rules,
	...rest
}: ContentType): ContentType {
	if (!Array.isArray(originalSchema)) {
		throw new Error('Expected schema to be an array');
	}

	const schema = [findFieldByUid(originalSchema, 'title')];

	const { options } = rest;
	if (isRecord(options) && options.is_page === true) {
		schema.push(findFieldByUid(originalSchema, 'url'));
	}

	const tax = schema.find((x) => isRecord(x) && x.data_type === 'taxonomy');
	if (tax) {
		schema.push(tax);
	}

	return { ...rest, schema };
}

function findFieldByUid(schema: SchemaFields, uid: string) {
	const match = schema.find((x) => isRecord(x) && x.uid === uid);

	if (!match) {
		throw new Error(`Expected schema to have a ${uid} field`);
	}

	return match;
}
