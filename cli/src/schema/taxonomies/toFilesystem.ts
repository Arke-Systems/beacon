import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import { isDeepStrictEqual } from 'node:util';
import type Ctx from '../ctx/Ctx.js';
import createProgressBar from '../lib/createProgressBar.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';

export default async function toFilesystem(ctx: Ctx) {
	using bar = createProgressBar(
		'Taxonomies',
		ctx.cs.taxonomies.byUid,
		ctx.fs.taxonomies.byUid,
	);

	const plan = planMerge(
		equality,
		ctx.cs.taxonomies.byUid,
		ctx.fs.taxonomies.byUid,
	);

	return await processPlan<NormalizedTaxonomy>({
		create: async (x) => ctx.fs.taxonomies.create(x),
		deletionStrategy: 'delete',
		plan,
		progress: bar,
		remove: async (x) => ctx.fs.taxonomies.remove(x),
		update: async (x) => ctx.fs.taxonomies.update(x),
	});
}

function equality(a: NormalizedTaxonomy, b: NormalizedTaxonomy) {
	return isDeepStrictEqual(
		{
			taxonomy: a.taxonomy,
			terms: a.terms ?? [],
		},
		{
			taxonomy: b.taxonomy,
			terms: b.terms ?? [],
		},
	);
}
