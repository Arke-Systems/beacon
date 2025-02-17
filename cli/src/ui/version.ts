import isRecord from '#cli/util/isRecord.js';
import { readFile } from 'node:fs/promises';

export default async function version() {
	try {
		const packageUrl = new URL('../../package.json', import.meta.url);
		const rawPackage = await readFile(packageUrl, 'utf8');
		const packageJson = JSON.parse(rawPackage) as unknown;

		if (!isRecord(packageJson)) {
			throw new Error('package.json is not an object');
		}

		const { version: result } = packageJson;

		if (typeof result !== 'string') {
			throw new Error('version is not a string');
		}

		return result;
	} catch {
		return 'unknown';
	}
}
