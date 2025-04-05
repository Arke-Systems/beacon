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

function transformClientConfig(configData: Config) {
	const x = configData.client;
	if (!x) {
		return;
	}

	const rawBaseUrl = x['base-url'];

	return {
		apiKey: x['api-key'],
		baseUrl: rawBaseUrl ? new URL(rawBaseUrl) : undefined,
		branch: x.branch,
		managementToken: x['management-token'],
		timeout: x.timeout,
	};
}

function transformSchemaConfig(configData: Config): PartialOptions['schema'] {
	const x = configData.schema;
	if (!x) {
		return;
	}

	const { assets, taxonomies } = x;

	return {
		...(assets ? { assets: { isIncluded: compileFilters(assets) } } : {}),
		deletionStrategy: x['deletion-strategy'],
		extension: transformMap(x.extension),
		jsonRtePlugin: transformMap(x['json-rte-plugin']),
		schemaPath: x['schema-path'],
		taxonomies: taxonomies ? new Map(Object.entries(taxonomies)) : undefined,
	};
}

function transformMap(mapping: Record<string, string> | undefined) {
	if (!mapping) {
		return;
	}

	return {
		byName: new Map(Object.entries(mapping)),
		byUid: new Map(Object.entries(mapping).map(([name, uid]) => [uid, name])),
	};
}
