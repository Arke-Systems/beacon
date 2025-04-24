import { styleText } from 'node:util';
import type { PartialOptions } from '../../ui/PartialOptions.js';
import type { Config } from '../Config.schema.yaml';
import transformClientConfig from './transformClientConfig.js';
import transformSchemaConfig from './transformSchemaConfig.js';

export default function transform(
	configData: Config,
	environmentName: string | undefined,
): PartialOptions {
	const base = {
		...(typeof configData.verbose === 'boolean'
			? { verbose: configData.verbose }
			: {}),
	};

	const environment =
		typeof environmentName === 'string'
			? configData.environments?.[environmentName]
			: null;

	if (environmentName && !environment) {
		const human = `"${styleText('yellowBright', environmentName)}"`;
		const msg = `The environment ${human} does not exist in the configuration.`;
		throw new Error(msg);
	}

	const client = transformClientConfig(configData.client, environment?.client);
	const schema = transformSchemaConfig(configData.schema, environment?.schema);

	return {
		...(client ? { client } : {}),
		...(schema ? { schema } : {}),
		...base,
	};
}
