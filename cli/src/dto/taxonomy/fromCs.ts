import type Taxonomy from '../../cs/taxonomies/Taxonomy.js';
import type Term from '../../cs/terms/Term.js';
import type NormalizedTaxonomy from './NormalizedTaxonomy.js';
import organize from './organize.js';

// Justification: The keys of these objects are ordered carefully to produce
// a readable and stable serialization.
/* eslint-disable sort-keys */

export default function fromCs(
	taxonomy: Taxonomy,
	terms?: readonly Term[],
): NormalizedTaxonomy {
	return (terms?.length ?? 0) > 0
		? { taxonomy: transformTaxonomy(taxonomy), terms: organize(terms ?? []) }
		: { taxonomy: transformTaxonomy(taxonomy) };
}

function transformTaxonomy({
	description,
	name,
	uid,
}: Taxonomy): NormalizedTaxonomy['taxonomy'] {
	return {
		uid,
		name,
		...(description ? { description } : {}),
	};
}
