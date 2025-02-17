import deleteGlobalField from '#cli/cs/global-fields/delete.js';
import importGlobalField from '#cli/cs/global-fields/import.js';
import type { Schema } from '#cli/cs/Types.js';
import { isSchema, itemKey } from '#cli/cs/Types.js';
import transform from '#cli/dto/schema/toCs.js';
import type Ctx from '../ctx/Ctx.js';
import equality from '../isEquivalentSchema.js';
import createProgressBar from '../lib/createProgressBar.js';
import getUi from '../lib/SchemaUi.js';
import indexFromFilesystem from '../xfer/indexFromFilesystem.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';
import schemaDirectory from './schemaDirectory.js';

export default async function toContentstack(ctx: Ctx) {
	const ui = getUi();
	const directory = schemaDirectory();
	const fsFields = await indexFromFilesystem(directory, isSchema, itemKey);
	using bar = createProgressBar('Global Fields', ctx.cs.globalFields, fsFields);

	return await processPlan<Schema>({
		create: async (schema) =>
			importGlobalField(ctx.cs.client, false, transform(schema)),
		deletionStrategy: ui.options.schema.deletionStrategy,
		plan: planMerge(equality, fsFields, ctx.cs.globalFields),
		progress: bar,
		remove: async (schema) => deleteGlobalField(ctx.cs.client, schema.uid),
		update: async (schema) =>
			importGlobalField(ctx.cs.client, true, transform(schema)),
	});
}
