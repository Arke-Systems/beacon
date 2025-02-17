import type Ctx from '../ctx/Ctx.js';
import CsTermCollection from '../ctx/lib/CsTermCollection.js';
import type TransferResults from '../xfer/TransferResults.js';
import filterTaxonomies from './lib/filterTaxonomies.js';
import mutations from './lib/mutations.js';
import processActions from './lib/processActions.js';

export default async function* toContentstack(
	ctx: Ctx,
): AsyncGenerator<[string, TransferResults]> {
	const fsWithTerms = filterTaxonomies(ctx.fs.taxonomies.byUid);
	if (fsWithTerms.size === 0) {
		return;
	}

	for (const [taxonomyUid, normalized] of fsWithTerms) {
		const csTaxonomy = ctx.cs.taxonomies.byUid.get(taxonomyUid);
		if (!csTaxonomy) {
			throw new Error(`Taxonomy not found: ${normalized.taxonomy.name}`);
		}

		const human = `${normalized.taxonomy.name} Terms`;
		const csTerms = new CsTermCollection(ctx.cs.client, csTaxonomy);
		const actions = mutations(normalized, csTerms);
		const allTerms = [...csTerms.all()];
		yield [human, await processActions(human, actions, allTerms)];
	}
}
