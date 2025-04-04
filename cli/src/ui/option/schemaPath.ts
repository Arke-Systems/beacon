import { Option } from 'commander';
import { resolve } from 'node:path';
import type Options from '../Options.js';

const schemaPath = new Option(
	'--schema-path <path>',
	'Output Contentstack schema files to the provided folder.',
);

export const defaultValue = './cs/schema';

schemaPath
	.default(defaultValue)
	.argParser((path) => resolve(path))
	.makeOptionMandatory();

export interface SchemaPathOption {
	readonly schemaPath: Options['schema']['schemaPath'];
}

export default schemaPath;
