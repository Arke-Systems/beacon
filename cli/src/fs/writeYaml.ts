import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'node:path';
import prettier from 'prettier';
import type { SchemaOptions } from 'yaml';
import { stringify } from 'yaml';

export default async function writeYaml(
	absolutePath: string,
	content: unknown,
	opts: SchemaOptions = { sortMapEntries: true },
) {
	const ugly = stringify(content, opts);

	const [pretty] = await Promise.all([
		format(absolutePath, ugly),
		mkdir(dirname(absolutePath), { recursive: true }),
	]);

	await writeFile(absolutePath, pretty, 'utf-8');
}

async function format(absolutePath: string, yamlContent: string) {
	const options = await prettier.resolveConfig(absolutePath);
	return prettier.format(yamlContent, { ...options, parser: 'yaml' });
}
