import isRecord from '#cli/util/isRecord.js';

export default interface TaxonomyValue {
	readonly taxonomy_uid: string;
	readonly term_uid: string;
}

export function isTaxonomyValue(value: unknown): value is TaxonomyValue {
	return (
		isRecord(value) &&
		typeof value.taxonomy_uid === 'string' &&
		typeof value.term_uid === 'string'
	);
}
