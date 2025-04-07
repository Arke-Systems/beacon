import type { SchemaField } from '#cli/cs/Types.js';

export default interface Replacer {
	process(schema: SchemaField, value: unknown): unknown;
}
