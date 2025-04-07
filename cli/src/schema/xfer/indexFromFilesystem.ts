import readYaml from '#cli/fs/readYaml.js';
import tryReadDir from '#cli/fs/tryReadDir.js';
import isRecord from '#cli/util/isRecord.js';
import { extname, resolve } from 'node:path';
import { styleText } from 'node:util';
import getUi from '../lib/SchemaUi.js';
import Filename from './Filename.js';

export default async function indexFromFilesystem<
	TItem extends Record<string, unknown>,
>(
	schemaPath: string,
	typeGuard: (a: Record<string, unknown>) => a is TItem,
	key: (a: TItem) => string,
): Promise<ReadonlyMap<string, TItem & { [Filename]: string }>> {
	const files = await tryReadDir(schemaPath, { withFileTypes: true });
	const result = new Map<string, TItem & { [Filename]: string }>();
	const ui = getUi();

	for (const file of files) {
		if (!file.isFile() || extname(file.name).toLowerCase() !== '.yaml') {
			continue;
		}

		const fullPath = resolve(schemaPath, file.name);
		const parsed = await readYaml(fullPath);

		if (!isRecord(parsed) || !typeGuard(parsed)) {
			ui.warn(
				'Invalid serialization found:',
				styleText('yellowBright', file.name),
			);

			continue;
		}

		if (result.has(key(parsed))) {
			ui.warn('Duplicate key found:', styleText('yellowBright', key(parsed)));

			continue;
		}

		result.set(key(parsed), { ...parsed, [Filename]: file.name });
	}

	return result;
}
