import type { ReferencePath } from '#cli/cs/entries/Types.js';
import type { SchemaField } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import taxonomyStrategy from '../../taxonomy/taxonomyStrategy.js';
import type Replacer from './Replacer.js';
import { isTaxonomyValue } from './TaxonomyValue.js';

export default class TaxonomyRemover implements Replacer {
	readonly #refPath: ReferencePath;

	public constructor(refPath: ReferencePath) {
		this.#refPath = refPath;
	}

	public process(schema: SchemaField, value: unknown) {
		return schema.data_type === 'taxonomy'
			? this.#removeTaxonomies(value)
			: value;
	}

	#removeTaxonomies(value: unknown) {
		if (value === null || value === undefined) {
			return;
		}

		if (!Array.isArray(value)) {
			const y = createStylus('yellowBright');
			const msg1 = y`Expected taxonomies in entry ${this.#refPath}`;
			const msg2 = y`to be an array, but found: ${typeof value}:`;
			getUi().warn(msg1, msg2, value);
			return value;
		}

		const result = (value as unknown[]).filter((x, idx) => {
			if (!isTaxonomyValue(x)) {
				const y = createStylus('yellowBright');
				const msg1 = y`Entry ${this.#refPath} contains an unexpected taxonomy`;
				const msg2 = y`data structure at index ${idx.toLocaleString()}:`;
				getUi().warn(msg1, msg2, value);
				return true;
			}

			const strategy = taxonomyStrategy(x.taxonomy_uid);
			return strategy === 'taxonomy and terms';
		});

		// 2025-04-06: Observed an otherwise identical entry in two different stacks
		// with no taxonomies, in which one stack returned `taxonomies: []` and the
		// other stack returned no `taxonomies` field at all.
		//
		// We need to consider these two entries to be equal. I am solving for this
		// by stripping away any empty taxonomy arrays while reading from CS.
		if (result.length) {
			return result;
		}
	}
}
