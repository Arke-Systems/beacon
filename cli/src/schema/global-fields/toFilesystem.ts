import exportGlobalField from '#cli/cs/global-fields/export.js';
import type { Schema } from '#cli/cs/Types.js';
import { isSchema, itemKey } from '#cli/cs/Types.js';
import { getFileExtension } from '#cli/fs/serializationFormat.js';
import writeSerializedData from '#cli/fs/writeSerializedData.js';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import fromCs from '../../dto/schema/fromCs.js';
import type Ctx from '../ctx/Ctx.js';
import isEquivalentSchema from '../isEquivalentSchema.js';
import createProgressBar from '../lib/createProgressBar.js';
import getUi from '../lib/SchemaUi.js';
import indexFromFilesystem from '../xfer/indexFromFilesystem.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';
import schemaDirectory from './schemaDirectory.js';

export default async function toFilesystem(ctx: Ctx) {
	const ui = getUi();
	const format = ui.options.schema.serializationFormat;
	const directory = schemaDirectory();
	const getPath = (uid: string) =>
		resolve(directory, `${uid}${getFileExtension(format)}`);

	const write = async (schema: Schema) => {
		const exported = await exportGlobalField(ctx.cs.client, schema.uid);
		const transformed = fromCs(exported);
		await writeSerializedData(getPath(schema.uid), transformed, format);
	};

	const fs = await indexFromFilesystem(directory, isSchema, itemKey);

	using bar = createProgressBar('Global Fields', fs, ctx.cs.globalFields);

	return await processPlan<Schema>({
		create: write,
		deletionStrategy: 'delete',
		plan: planMerge(isEquivalentSchema, ctx.cs.globalFields, fs),
		progress: bar,
		remove: async (schema) => rm(getPath(schema.uid), { force: true }),
		update: write,
	});
}
