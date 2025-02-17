import { Ajv } from 'ajv';
import formats from 'ajv-formats';
import yaml from 'js-yaml';
import { readFile } from 'node:fs/promises';
import isRecord from '../util/isRecord.js';
import type { Config } from './Config.schema.yaml';

export default async function createSchemaValidationFn() {
	const ajv = new Ajv();

	// I'm having trouble getting both TSC and ESLint to agree that the
	// default export of `ajv-formats` is a `FormatsPlugin`, and thus
	// a callable function.
	const addFormats = formats as unknown as (ajv: Ajv) => void;
	addFormats(ajv);

	const schemaUrl = new URL('./Config.schema.yaml', import.meta.url);
	const schemaFile = await readFile(schemaUrl, 'utf8');
	const schema = yaml.load(schemaFile);
	if (!isRecord(schema)) {
		throw new Error('Invalid schema');
	}

	return ajv.compile<Config>(schema);
}
