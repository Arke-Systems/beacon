import type NormalizedLabel from '#cli/dto/label/NormalizedLabel.js';
import { isDeepStrictEqual } from 'node:util';
import type Ctx from '../ctx/Ctx.js';
import createProgressBar from '../lib/createProgressBar.js';
import getUi from '../lib/SchemaUi.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';

export default async function toContentstack(ctx: Ctx) {
	using bar = createProgressBar(
		'Labels',
		ctx.cs.labels.byName,
		ctx.fs.labels.byName,
	);

	const plan = planMerge(equality, ctx.fs.labels.byName, ctx.cs.labels.byName);

	return await processPlan<NormalizedLabel>({
		create: async (x) => ctx.cs.labels.create(x),
		deletionStrategy: getUi().options.schema.deletionStrategy,
		plan,
		progress: bar,
		remove: async (x) => ctx.cs.labels.remove(x),
		update: async (x) => ctx.cs.labels.update(x),
	});
}

function equality(a: NormalizedLabel, b: NormalizedLabel) {
	return isDeepStrictEqual(a.label, b.label);
}
