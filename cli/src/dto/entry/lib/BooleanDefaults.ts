import type { SchemaField } from '#cli/cs/Types.js';
import type Replacer from './Replacer.js';

// 2024-04-06: Observed that an entry containing a boolean field that appears
// as `false` in the UI may be exported as either `false` or entirely missing
// from the JSON.
//
// If the field is really set to `false` in the JSON, everything is fine.
//
// However, if the field is missing from the JSON, then importing the entry
// into a different stack will cause the field to be set to `false`, which
// is good, but then if a second import takes place, the field is detected
// as being different (`false !== undefined`), so the entry is re-imported.
//
// We wish to avoid this re-import behavior. To do so, we detect missing
// boolean fields and set them to `false` as we read the entry from CS.
export default class BooleanDefaults implements Replacer {
	public process(schema: SchemaField, value: unknown) {
		return schema.data_type === 'boolean' && value === undefined
			? false
			: value;
	}
}
