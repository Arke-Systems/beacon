import yaml from 'js-yaml';
import type { PathLike } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { PartialOptions } from '../ui/PartialOptions.js';
import ConfigMissingError from './ConfigMissingError.js';
import ConfigurationError from './ConfigurationError.js';
import createSchemaValidationFn from './createSchemaValidationFn.js';
import transform from './transform.js';

export default async function loadConfig(
	configFile: PathLike,
): Promise<PartialOptions> {
	let raw: string;

	try {
		raw = await readFile(configFile, 'utf8');
	} catch (ex: unknown) {
		if (!(ex instanceof Error)) {
			throw ex;
		}

		if (!('code' in ex)) {
			throw ex;
		}

		if (ex.code !== 'ENOENT') {
			throw ex;
		}

		throw new ConfigMissingError(
			'Configuration file not found: ' + String(configFile),
		);
	}

	const cfg = yaml.load(raw);
	const validate = await createSchemaValidationFn();

	if (!validate(cfg)) {
		throw new ConfigurationError(configFile, validate.errors);
	}

	return { ...transform(cfg), configFile };
}
