import type { Entry } from '#cli/cs/entries/Types.js';
import taxonomyStrategy from '#cli/dto/taxonomy/taxonomyStrategy.js';
import type BeaconReplacer from '../../BeaconReplacer.js';
import { isTaxonomyValue } from '../../lib/TaxonomyValue.js';

export default function stripTaxonomies(this: BeaconReplacer, entry: Entry) {
	const field = this.contentType.schema.find((x) => x.data_type === 'taxonomy');
	if (!field) {
		return entry;
	}

	const value = entry[field.uid];
	if (!value) {
		return entry;
	}

	if (!Array.isArray(value)) {
		return entry;
	}

	const updated = (value as unknown[]).filter((x) => {
		if (!isTaxonomyValue(x)) {
			return true;
		}

		const strategy = taxonomyStrategy(x.taxonomy_uid);
		return strategy === 'taxonomy and terms';
	});

	if (updated.length) {
		return { ...entry, [field.uid]: updated };
	}

	const clone = { ...entry };
	// Justification: We are removing the field from the entry because it
	// contains no further taxonomies that we wish to update.
	// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
	delete clone[field.uid];
	return clone;
}
