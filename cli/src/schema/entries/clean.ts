import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import tryReadDir from '../../fs/tryReadDir.js';
import getUi from '../lib/SchemaUi.js';
import type TransferResults from '../xfer/TransferResults.js';
import { MutableTransferResults } from '../xfer/TransferResults.js';

export default async function clean(
	exceptForContentTypeUids: ReadonlySet<string>,
): Promise<TransferResults> {
	const { options: { schema: {
		schemaPath,
		entries: { isIncluded }
	}} } = getUi();

	const baseDirectory = resolve(schemaPath, 'entries');
	const results = new MutableTransferResults();
	const children = await tryReadDir(baseDirectory);

	for (const child of children) {
		if (!child.isDirectory()) {
			continue;
		}

		if (!isIncluded(child.name) || exceptForContentTypeUids.has(child.name)) {
			continue;
		}

		const fullPath = resolve(baseDirectory, child.name);
		await rm(fullPath, { recursive: true });
		results.deleted.add(child.name);
	}

	return results;
}
