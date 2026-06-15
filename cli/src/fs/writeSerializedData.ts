import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'node:path';
import type { SchemaOptions } from 'yaml';
import { stringify } from 'yaml';
import type { SerializationFormat } from '../ui/Options.js';

const JSON_INDENT_SPACES = 2;

/**
 * Write data to a file in the specified format (YAML or JSON).
 */
export default async function writeSerializedData(
	absolutePath: string,
	content: unknown,
	format: SerializationFormat,
	yamlOpts: SchemaOptions = { sortMapEntries: true },
) {
	const output =
		format === 'json'
			? JSON.stringify(content, null, JSON_INDENT_SPACES) + '\n'
			: stringify(content, yamlOpts);

	await mkdir(dirname(absolutePath), { recursive: true });
	await writeFile(absolutePath, output, 'utf-8');
}
