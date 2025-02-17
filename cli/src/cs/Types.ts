import isRecord from '#cli/util/isRecord.js';

export type Item = Record<string, unknown> & { readonly uid: string };

export function isItem(o: unknown): o is Item {
	return isRecord(o) && typeof o.uid === 'string';
}

export function itemKey(o: Item) {
	return o.uid;
}

// A Contentstack Schema (either a content type or a global field)
export interface Schema extends Item {
	readonly title: string;
	readonly schema: SchemaFields;
}

export function isSchema(o: unknown): o is Schema {
	return isItem(o) && typeof o.title === 'string' && isSchemaFields(o.schema);
}

export interface SchemaField extends Item {
	readonly data_type: string;
}

export function isSchemaField(o: unknown): o is SchemaField {
	return isItem(o) && typeof o.data_type === 'string';
}

export type SchemaFields = readonly SchemaField[];

export function isSchemaFields(o: unknown): o is SchemaFields {
	return Array.isArray(o) && o.every(isSchemaField);
}
