import type { PathLike } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

export default async function readYaml(pathLike: PathLike): Promise<unknown> {
	const raw = await readFile(pathLike, 'utf-8');
	return parse(raw);
}
