import type NormalizedLabel from '#cli/dto/label/NormalizedLabel.js';
import { isDeepStrictEqual } from 'node:util';
import type Ctx from '../ctx/Ctx.js';
import createProgressBar from '../lib/createProgressBar.js';
import getUi from '../lib/SchemaUi.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';

export default async function toContentstack(ctx: Ctx) {
	const ui = getUi();
	const { isIncluded } = ui.options.schema.labels;

	// Filter CS and FS label maps to only include labels that pass the filter
	const csLabels = filterLabels(ctx.cs.labels.byName, isIncluded);
	const fsLabels = filterLabels(ctx.fs.labels.byName, isIncluded);

	using bar = createProgressBar('Labels', csLabels, fsLabels);

	const plan = planMerge(equality, fsLabels, csLabels);

	return await processPlan<NormalizedLabel>({
		create: async (x) => ctx.cs.labels.create(x),
		deletionStrategy: ui.options.schema.deletionStrategy,
		plan,
		progress: bar,
		remove: async (x) => ctx.cs.labels.remove(x),
		update: async (x) => ctx.cs.labels.update(x),
	});
}

function filterLabels(
	labels: ReadonlyMap<string, NormalizedLabel>,
	isIncluded: (labelName: string) => boolean,
): ReadonlyMap<string, NormalizedLabel> {
	const filtered = new Map<string, NormalizedLabel>();
	for (const [name, label] of labels) {
		if (isIncluded(name)) {
			filtered.set(name, label);
		}
	}
	return filtered;
}

function equality(a: NormalizedLabel, b: NormalizedLabel) {
	return isDeepStrictEqual(a.label, b.label);
}
