import type { PathLike } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import type { PartialOptions } from '../ui/PartialOptions.js';
import ConfigMissingError from './ConfigMissingError.js';
import ConfigurationError from './ConfigurationError.js';
import createSchemaValidationFn from './createSchemaValidationFn.js';
import transform from './transform/transform.js';

export default async function loadConfig(
	configFile: PathLike,
	namedEnvironment: string | undefined,
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

	const cfg: unknown = parse(raw);
	const validate = await createSchemaValidationFn();

	if (!validate(cfg)) {
		throw new ConfigurationError(configFile, validate.errors);
	}

	return transform(cfg, namedEnvironment);
}
