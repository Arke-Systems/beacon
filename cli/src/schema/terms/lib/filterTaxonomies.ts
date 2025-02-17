import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import taxonomyStrategy from '#cli/dto/taxonomy/taxonomyStrategy.js';

export default function filterTaxonomies(
	normalized: ReadonlyMap<string, NormalizedTaxonomy>,
): ReadonlyMap<string, NormalizedTaxonomy> {
	const withTerms = new Map<string, NormalizedTaxonomy>();

	for (const [uid, taxonomy] of normalized) {
		const strategy = taxonomyStrategy(taxonomy.taxonomy.uid);
		if (strategy === 'taxonomy and terms') {
			withTerms.set(uid, taxonomy);
		}
	}

	return withTerms;
}
