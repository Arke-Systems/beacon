import exportContentType from '#cli/cs/content-types/export.js';
import type { Schema } from '#cli/cs/Types.js';
import writeYaml from '#cli/fs/writeYaml.js';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import fromCs from '../../dto/schema/fromCs.js';
import type Ctx from '../ctx/Ctx.js';
import isEquivalentSchema from '../isEquivalentSchema.js';
import createProgressBar from '../lib/createProgressBar.js';
import planMerge from '../xfer/lib/planMerge.js';
import processPlan from '../xfer/lib/processPlan.js';
import schemaDirectory from './schemaDirectory.js';

export default async function toFilesystem(ctx: Ctx) {
	const directory = schemaDirectory();
	const getPath = (uid: string) => resolve(directory, `${uid}.yaml`);

	const write = async (schema: Schema) => {
		const exported = await exportContentType(ctx.cs.client, schema.uid);
		const transformed = fromCs(exported);
		await writeYaml(getPath(schema.uid), transformed);
	};

	using bar = createProgressBar(
		'Content Types',
		ctx.cs.contentTypes,
		ctx.fs.contentTypes,
	);

	const plan = planMerge(
		isEquivalentSchema,
		ctx.cs.contentTypes,
		ctx.fs.contentTypes,
	);

	return await processPlan<Schema>({
		create: write,
		deletionStrategy: 'delete',
		plan,
		progress: bar,
		remove: async (schema) => rm(getPath(schema.uid), { force: true }),
		update: write,
	});
}
