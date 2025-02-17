import type Client from '#cli/cs/api/Client.js';
import CsAssets from '#cli/cs/assets/Assets.js';
import indexAssets from '#cli/cs/assets/index.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import indexAllCsEntries from '#cli/cs/entries/indexAllCsEntries.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import indexGlobalFields from '#cli/cs/global-fields/index.js';
import type { Schema } from '#cli/cs/Types.js';
import transformEntry from '#cli/dto/entry/fromCs.js';
import fromCs from '#cli/dto/schema/fromCs.js';
import FsAssets from '#cli/fs/assets/Assets.js';
import EntryCollection from '#cli/schema/entries/EntryCollection.js';
import indexFsTaxonomies from '#cli/schema/taxonomies/lib/indexFs.js';
import indexAllFsEntries from '../entries/indexAllFsEntries.js';
import { ReferenceMap } from '../references/ReferenceMap.js';
import indexCsTaxonomies from '../taxonomies/lib/indexCs.js';
import CsTaxonomyCollection from './lib/CsTaxonomyCollection.js';
import FsTaxonomyCollection from './lib/FsTaxonomyCollection.js';
import type TaxonomyCollection from './lib/TaxonomyCollection.js';

interface BaseCtx {
	readonly contentTypes: ReadonlyMap<ContentType['uid'], ContentType>;
	readonly entries: EntryCollection;
	readonly taxonomies: TaxonomyCollection;
}

interface CsCtx extends BaseCtx {
	readonly client: Client;
	readonly assets: CsAssets;
	readonly globalFields: ReadonlyMap<Schema['uid'], Schema>;
}

interface FsCtx extends BaseCtx {
	readonly assets: FsAssets;
}

export default class Ctx {
	public readonly references = new ReferenceMap();
	public readonly cs: CsCtx;
	public readonly fs: FsCtx;

	private constructor(
		client: Client,
		csTaxonomies: Awaited<ReturnType<typeof indexCsTaxonomies>>,
		csAssets: Awaited<ReturnType<typeof indexAssets>>,
		csGlobalFields: Awaited<ReturnType<typeof indexGlobalFields>>,
		csEntries: Awaited<ReturnType<typeof indexAllCsEntries>>,
		fsTaxonomies: Awaited<ReturnType<typeof indexFsTaxonomies>>,
		fsEntries: Awaited<ReturnType<typeof indexAllFsEntries>>,
		fsAssets: FsAssets,
	) {
		this.cs = {
			assets: new CsAssets(client, csAssets),
			client,
			contentTypes: transformCsSchema(csEntries.keys()),
			entries: new EntryCollection(csEntries),
			globalFields: transformCsSchema(csGlobalFields.values()),
			taxonomies: new CsTaxonomyCollection(client, csTaxonomies),
		};

		this.fs = {
			assets: fsAssets,
			contentTypes: new Map(
				[...fsEntries.keys()].map((contentType) => [
					contentType.uid,
					contentType,
				]),
			),

			entries: new EntryCollection(fsEntries),
			taxonomies: new FsTaxonomyCollection(fsTaxonomies),
		};

		this.cs = { ...this.cs, entries: this.#transformCsEntries(csEntries) };
	}

	public static async prepare(client: Client): Promise<Ctx> {
		const [
			csTaxonomies,
			csAssets,
			csGlobalFields,
			csEntries,
			fsTaxonomies,
			fsEntries,
			fsAssets,
		] = await Promise.all([
			indexCsTaxonomies(client),
			indexAssets(client),
			indexGlobalFields(client),
			indexAllCsEntries(client),
			indexFsTaxonomies(),
			indexAllFsEntries(),
			FsAssets.create(),
		]);

		return new Ctx(
			client,
			csTaxonomies,
			csAssets,
			csGlobalFields,
			csEntries,
			fsTaxonomies,
			fsEntries,
			fsAssets,
		);
	}

	#transformCsEntries(
		csEntries: ReadonlyMap<ContentType, ReadonlySet<Entry>>,
	): EntryCollection {
		const result = new Map<ContentType, ReadonlySet<Entry>>();

		for (const [contentType, entries] of csEntries) {
			const transformed = new Set<Entry>();
			result.set(contentType, transformed);

			for (const entry of entries) {
				transformed.add(transformEntry(this, contentType, entry));
			}
		}

		return new EntryCollection(result);
	}
}

function transformCsSchema(
	schemas: IterableIterator<Schema>,
): ReadonlyMap<Schema['uid'], Schema> {
	const result = new Map<Schema['uid'], Schema>();

	for (const schema of schemas) {
		result.set(schema.uid, fromCs(schema));
	}

	return result;
}
