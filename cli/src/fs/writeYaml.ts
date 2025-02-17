import { mkdir, writeFile } from 'fs/promises';
import yaml from 'js-yaml';
import { dirname } from 'node:path';
import prettier from 'prettier';

export default async function writeYaml(
	absolutePath: string,
	content: unknown,
	opts: yaml.DumpOptions = { sortKeys: true },
) {
	const ugly = yaml.dump(content, opts);

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
