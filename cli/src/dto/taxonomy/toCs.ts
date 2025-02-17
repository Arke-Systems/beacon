import type TaxonomyDetail from '#cli/cs/taxonomies/TaxonomyDetail.js';
import flatten from './flatten.js';
import type NormalizedTaxonomy from './NormalizedTaxonomy.js';
import taxonomyStrategy from './taxonomyStrategy.js';

export default function toCs(normalized: NormalizedTaxonomy): TaxonomyDetail {
	const strategy = taxonomyStrategy(normalized.taxonomy.uid);

	if (strategy === 'only taxonomy') {
		return {
			taxonomy: transformTaxonomy(normalized.taxonomy),
			terms: [],
		};
	}

	return {
		taxonomy: transformTaxonomy(normalized.taxonomy),
		terms: flatten(normalized.terms ?? []),
	};
}

function transformTaxonomy({
	description,
	name,
	uid,
}: NormalizedTaxonomy['taxonomy']): TaxonomyDetail['taxonomy'] {
	return {
		description: description ?? '',
		name,
		uid,
	};
}
