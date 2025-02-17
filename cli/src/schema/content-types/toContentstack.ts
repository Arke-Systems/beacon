import deleteContentType from '#cli/cs/content-types/delete.js';
import importContentType from '#cli/cs/content-types/import.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import transform from '#cli/dto/schema/toCs.js';
import type Ctx from '../ctx/Ctx.js';
import isEquivalentSchema from '../isEquivalentSchema.js';
import createProgressBar from '../lib/createProgressBar.js';
import getUi from '../lib/SchemaUi.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';

export default async function toContentstack(ctx: Ctx) {
	const ui = getUi();

	const write = async (schema: ContentType) =>
		importContentType(ctx.cs.client, transform(schema), true);

	using bar = createProgressBar(
		'Content Types',
		ctx.cs.contentTypes,
		ctx.fs.contentTypes,
	);

	const plan = planMerge(
		isEquivalentSchema,
		ctx.fs.contentTypes,
		ctx.cs.contentTypes,
	);

	return await processPlan<ContentType>({
		create: write,
		deletionStrategy: ui.options.schema.deletionStrategy,
		plan,
		progress: bar,
		remove: async (schema) => deleteContentType(ctx.cs.client, schema.uid),
		update: write,
	});
}
