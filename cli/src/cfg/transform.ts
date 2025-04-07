import type { PartialOptions } from '../ui/PartialOptions.js';
import compileFilters from './compileFilters.js';
import type { Config } from './Config.schema.yaml';

export default function transform(configData: Config): PartialOptions {
	return {
		client: transformClientConfig(configData),
		schema: transformSchemaConfig(configData),
		...(typeof configData.verbose === 'boolean'
			? { verbose: configData.verbose }
			: {}),
	};
}

function transformClientConfig({ client }: Config) {
	if (!client) {
		return;
	}

	const {
		'api-key': apiKey,
		'base-url': baseUrl,
		branch,
		'management-token': managementToken,
		timeout,
	} = client;

	return {
		...(apiKey ? { apiKey } : {}),
		...(baseUrl ? { baseUrl: new URL(baseUrl) } : {}),
		...(branch ? { branch } : {}),
		...(managementToken ? { managementToken } : {}),
		...(typeof timeout === 'number' ? { timeout } : {}),
	};
}

function transformSchemaConfig({ schema }: Config): PartialOptions['schema'] {
	if (!schema) {
		return;
	}

	const {
		assets,
		'deletion-strategy': strategy,
		extension,
		'json-rte-plugin': jsonRtePlugin,
		'schema-path': schemaPath,
		taxonomies,
	} = schema;

	return {
		...(assets ? { assets: { isIncluded: compileFilters(assets) } } : {}),
		...(strategy ? { deletionStrategy: strategy } : {}),
		...(extension ? { extension: transformMap(extension) } : {}),
		...(jsonRtePlugin ? { jsonRtePlugin: transformMap(jsonRtePlugin) } : {}),
		...(schemaPath ? { schemaPath } : {}),
		...(taxonomies ? { taxonomies: new Map(Object.entries(taxonomies)) } : {}),
	};
}

function transformMap(mapping: Record<string, string>) {
	return {
		byName: new Map(Object.entries(mapping)),
		byUid: new Map(Object.entries(mapping).map(([name, uid]) => [uid, name])),
	};
}
