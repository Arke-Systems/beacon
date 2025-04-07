import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'node:path';
import type { SchemaOptions } from 'yaml';
import { stringify } from 'yaml';

export default async function writeYaml(
	absolutePath: string,
	content: unknown,
	opts: SchemaOptions = { sortMapEntries: true },
) {
	const output = stringify(content, opts);
	await mkdir(dirname(absolutePath), { recursive: true });
	await writeFile(absolutePath, output, 'utf-8');
}
