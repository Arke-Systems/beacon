import type Client from '#cli/cs/api/Client.js';
import deleteTaxonomy from '#cli/cs/taxonomies/delete.js';
import importTaxonomy from '#cli/cs/taxonomies/import.js';
import type Taxonomy from '#cli/cs/taxonomies/Taxonomy.js';
import updateTaxonomy from '#cli/cs/taxonomies/update.js';
import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import toCs from '#cli/dto/taxonomy/toCs.js';
import type TaxonomyCollection from './TaxonomyCollection.js';

export default class CsTaxonomyCollection implements TaxonomyCollection {
	readonly #taxonomies: Map<Taxonomy['uid'], NormalizedTaxonomy>;

	public constructor(
		private readonly client: Client,
		taxonomies: ReadonlyMap<Taxonomy['uid'], NormalizedTaxonomy>,
	) {
		this.#taxonomies = new Map(taxonomies);
	}

	public get byUid(): ReadonlyMap<Taxonomy['uid'], NormalizedTaxonomy> {
		return this.#taxonomies;
	}

	public async create(normalized: NormalizedTaxonomy): Promise<void> {
		await importTaxonomy(this.client, toCs(normalized));
		this.#taxonomies.set(normalized.taxonomy.uid, normalized);
	}

	public async remove(normalized: NormalizedTaxonomy): Promise<void> {
		await deleteTaxonomy(this.client, normalized.taxonomy.uid);
		this.#taxonomies.delete(normalized.taxonomy.uid);
	}

	public async update(normalized: NormalizedTaxonomy): Promise<void> {
		const existing = this.#taxonomies.get(normalized.taxonomy.uid);

		if (!existing) {
			throw new Error(`Taxonomy ${normalized.taxonomy.uid} does not exist`);
		}

		await updateTaxonomy(this.client, toCs(normalized).taxonomy);

		this.#taxonomies.set(normalized.taxonomy.uid, {
			...existing,
			taxonomy: normalized.taxonomy,
		});
	}
}
