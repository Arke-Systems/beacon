import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import { isDeepStrictEqual } from 'node:util';
import type Ctx from '../ctx/Ctx.js';
import createProgressBar from '../lib/createProgressBar.js';
import getUi from '../lib/SchemaUi.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';

export default async function toContentstack(ctx: Ctx) {
	using bar = createProgressBar(
		'Taxonomies',
		ctx.cs.taxonomies.byUid,
		ctx.fs.taxonomies.byUid,
	);

	const plan = planMerge(
		equality,
		ctx.fs.taxonomies.byUid,
		ctx.cs.taxonomies.byUid,
	);

	return await processPlan<NormalizedTaxonomy>({
		create: async (x) => ctx.cs.taxonomies.create(x),
		deletionStrategy: getUi().options.schema.deletionStrategy,
		plan,
		progress: bar,
		remove: async (x) => ctx.cs.taxonomies.remove(x),
		update: async (x) => ctx.cs.taxonomies.update(x),
	});
}

function equality(a: NormalizedTaxonomy, b: NormalizedTaxonomy) {
	return isDeepStrictEqual(a.taxonomy, b.taxonomy);
}
