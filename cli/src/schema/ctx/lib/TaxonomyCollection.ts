import type Taxonomy from '#cli/cs/taxonomies/Taxonomy.js';
import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';

export default interface TaxonomyCollection {
	readonly byUid: ReadonlyMap<Taxonomy['uid'], NormalizedTaxonomy>;
	create(normalized: NormalizedTaxonomy): Promise<void>;
	remove(normalized: NormalizedTaxonomy): Promise<void>;
	update(normalized: NormalizedTaxonomy): Promise<void>;
}
