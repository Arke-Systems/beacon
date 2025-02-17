import { writeFile } from 'node:fs/promises';
import { compileFromFile } from 'json-schema-to-typescript';
import { fileURLToPath } from 'node:url';
import { configSchema, configTypes } from './paths.js';
import { humanizePath } from '../../../build/lib/humanize.js';

export default async function preTsc() {
	console.info(
		'Compiling',
		humanizePath(configSchema),
		'to',
		humanizePath(configTypes),
	);

	await writeFile(
		configTypes,
		await compileFromFile(fileURLToPath(configSchema)),
		'utf-8',
	);
}
