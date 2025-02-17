import isRecord from '#cli/util/isRecord.js';
import type Term from '../terms/Term.js';
import { isTerm } from '../terms/Term.js';
import type Taxonomy from './Taxonomy.js';
import { isTaxonomy } from './Taxonomy.js';

export default interface TaxonomyDetail {
	readonly taxonomy: Taxonomy;
	readonly terms: readonly Term[];
}

export function isTaxonomyDetail(
	o: unknown,
): o is Record<string, unknown> & TaxonomyDetail {
	return (
		isRecord(o) &&
		isTaxonomy(o.taxonomy) &&
		Array.isArray(o.terms) &&
		o.terms.every(isTerm)
	);
}

export function key(o: TaxonomyDetail) {
	return o.taxonomy.uid;
}
