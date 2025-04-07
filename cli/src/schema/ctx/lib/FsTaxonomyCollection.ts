import type Taxonomy from '#cli/cs/taxonomies/Taxonomy.js';
import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import writeYaml from '#cli/fs/writeYaml.js';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import schemaDirectory from '../../taxonomies/schemaDirectory.js';
import type TaxonomyCollection from './TaxonomyCollection.js';

export default class FsTaxonomyCollection implements TaxonomyCollection {
	readonly #directory = schemaDirectory();
	readonly #taxonomies: Map<Taxonomy['uid'], NormalizedTaxonomy>;

	public constructor(
		taxonomies: ReadonlyMap<Taxonomy['uid'], NormalizedTaxonomy>,
	) {
		this.#taxonomies = new Map(taxonomies);
	}

	public get byUid(): ReadonlyMap<Taxonomy['uid'], NormalizedTaxonomy> {
		return this.#taxonomies;
	}

	public async create(normalized: NormalizedTaxonomy): Promise<void> {
		await this.#write(normalized);
		this.#taxonomies.set(normalized.taxonomy.uid, normalized);
	}

	public async remove(normalized: NormalizedTaxonomy): Promise<void> {
		await rm(this.#getPath(normalized.taxonomy.uid), { force: true });
		this.#taxonomies.delete(normalized.taxonomy.uid);
	}

	public async update(normalized: NormalizedTaxonomy): Promise<void> {
		await this.#write(normalized);
		this.#taxonomies.set(normalized.taxonomy.uid, normalized);
	}

	async #write(normalized: NormalizedTaxonomy) {
		const path = this.#getPath(normalized.taxonomy.uid);
		return writeYaml(path, normalized, { sortMapEntries: false });
	}

	#getPath(uid: string) {
		return resolve(this.#directory, `${uid}.yaml`);
	}
}
