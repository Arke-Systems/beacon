import type { Schema } from '#cli/cs/Types.js';
import { isDeepStrictEqual } from 'node:util';
import normalize from './normalize.js';

// The updated_at and _version fields appear in Contentstack schema responses,
// and these values change with every update to the schema. Sadly, this happens
// even for importing/exporting schemas (i.e., our CI/CD pipeline). As a result,
// we cannot depend on these fields to determine whether a schema has changed,
// because the "change" may just be a re-import of the same schema.
//
// Instead, this function compares schemas using deep equality, while omitting
// fields that we don't actually care about.
//
// This is also necessary because the "import/export" data structure differs
// from the "read" data structure. We decide if a schema needs to be imported
// or exported by comparing the contents of the "read" structure with the
// contents of the most recent import/export. These structures are _mostly_
// the same, but not entirely.
export default function isEquivalentSchema(a: Schema, b: Schema) {
	return isDeepStrictEqual(normalize(a), normalize(b));
}
