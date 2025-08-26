import type { PathLike } from 'node:fs';
import { readdir } from 'node:fs/promises';

export default async function tryReadDir(path: PathLike, recursive?: boolean) {
	try {
		return await readdir(path, { recursive, withFileTypes: true });
	} catch (ex: unknown) {
		if (ex instanceof Error && 'code' in ex && ex.code === 'ENOENT') {
			return []; // Missing directory === empty directory
		}

		throw ex;
	}
}
