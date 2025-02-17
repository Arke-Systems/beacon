import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import tryReadDir from '../../fs/tryReadDir.js';
import type TransferResults from '../xfer/TransferResults.js';
import { MutableTransferResults } from '../xfer/TransferResults.js';

export default async function clean(
	baseSchemaPath: string,
	exceptForContentTypeUids: ReadonlySet<string>,
): Promise<TransferResults> {
	const baseDirectory = resolve(baseSchemaPath, 'entries');
	const results = new MutableTransferResults();
	const children = await tryReadDir(baseDirectory, { withFileTypes: true });

	for (const child of children) {
		if (!child.isDirectory()) {
			continue;
		}

		if (exceptForContentTypeUids.has(child.name)) {
			continue;
		}

		const fullPath = resolve(baseDirectory, child.name);
		await rm(fullPath, { recursive: true });
		results.deleted.add(child.name);
	}

	return results;
}
