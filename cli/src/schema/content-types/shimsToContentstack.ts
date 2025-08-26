import importContentType from '#cli/cs/content-types/import.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import type Ctx from '../ctx/Ctx.js';
import isEquivalentSchema from '../isEquivalentSchema.js';
import createProgressBar from '../lib/createProgressBar.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';
import reduceToShim from './reduceToShim.js';

// See /doc/lessons-learned/circular-references.md for the reasoning behind
// this function.
export default async function shimsToContentstack(ctx: Ctx) {
	const create = async (schema: ContentType) =>
		importContentType(ctx.cs.client, reduceToShim(schema), false);

	using bar = createProgressBar(
		'Content Type Shims',
		ctx.cs.contentTypes,
		ctx.fs.contentTypes,
	);

	const plan = planMerge(
		isEquivalentSchema,
		ctx.fs.contentTypes,
		ctx.cs.contentTypes,
	);

	return await processPlan<ContentType>({
		create,
		deletionStrategy: 'ignore',
		plan,
		progress: bar,
		remove: noop,
		update: noop,
	});
}

async function noop() {
	// no-op: content type shims are stand-ins for a full content type,
	// and are only updated or updated when the full content type is removed
	// or updated.
}
