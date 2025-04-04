import { Ajv } from 'ajv';
import formats from 'ajv-formats';
import readYaml from '../fs/readYaml.js';
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
	const schema = await readYaml(schemaUrl);
	if (!isRecord(schema)) {
		throw new Error('Invalid schema');
	}

	return ajv.compile<Config>(schema);
}
