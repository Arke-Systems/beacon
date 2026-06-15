import type { PartialOptions } from '../../ui/PartialOptions.js';
import type { Config } from '../Config.schema.yaml';
import compileFilters from './compileFilters.js';

export default function transformSchemaConfig(
	baseSchema: Config['schema'],
	envSchema: Config['schema'],
): PartialOptions['schema'] {
	const schema = mergeSchemas(baseSchema, envSchema);

	const {
		assets,
		'deletion-strategy': strategy,
		entries,
		extension,
		'json-rte-plugin': jsonRtePlugin,
		labels,
		'schema-path': schemaPath,
		'serialization-format': serializationFormat,
		taxonomies,
	} = schema;

	const result = buildResult({
		assets,
		entries,
		extension,
		jsonRtePlugin,
		labels,
		schemaPath,
		serializationFormat,
		strategy,
		taxonomies,
	});

	return Object.keys(result).length ? result : undefined;
}

function mergeSchemas(
	baseSchema: Config['schema'],
	envSchema: Config['schema'],
) {
	return {
		...baseSchema,
		...envSchema,
		...collapseMap(baseSchema?.extension, envSchema?.extension, 'extension'),
		...collapseMap(baseSchema?.taxonomies, envSchema?.taxonomies, 'taxonomies'),
		...collapseAssets(baseSchema?.assets, envSchema?.assets),
		...collapseEntries(baseSchema?.entries, envSchema?.entries),
		...collapseLabels(baseSchema?.labels, envSchema?.labels),

		...collapseMap(
			baseSchema?.['json-rte-plugin'],
			envSchema?.['json-rte-plugin'],
			'json-rte-plugin',
		),
	};
}

function buildResult(params: {
	assets: NonNullable<Config['schema']>['assets'];
	entries: NonNullable<Config['schema']>['entries'];
	extension: NonNullable<Config['schema']>['extension'];
	jsonRtePlugin: NonNullable<Config['schema']>['json-rte-plugin'];
	labels: NonNullable<Config['schema']>['labels'];
	schemaPath: string | undefined;
	serializationFormat: NonNullable<Config['schema']>['serialization-format'];
	strategy: NonNullable<Config['schema']>['deletion-strategy'];
	taxonomies: NonNullable<Config['schema']>['taxonomies'];
}) {
	return {
		...(params.assets
			? { assets: { isIncluded: compileFilters(params.assets) } }
			: {}),
		...(params.strategy ? { deletionStrategy: params.strategy } : {}),
		...(params.entries
			? { entries: { isIncluded: compileFilters(params.entries) } }
			: {}),
		...(params.extension ? { extension: transformMap(params.extension) } : {}),
		...(params.jsonRtePlugin
			? { jsonRtePlugin: transformMap(params.jsonRtePlugin) }
			: {}),
		...(params.labels
			? { labels: { isIncluded: compileFilters(params.labels) } }
			: {}),
		...(params.schemaPath ? { schemaPath: params.schemaPath } : {}),
		...(params.serializationFormat
			? { serializationFormat: params.serializationFormat }
			: {}),
		...(params.taxonomies
			? { taxonomies: new Map(Object.entries(params.taxonomies)) }
			: {}),
	};
}

function transformMap(mapping: Record<string, string>) {
	return {
		byName: new Map(Object.entries(mapping)),
		byUid: new Map(Object.entries(mapping).map(([name, uid]) => [uid, name])),
	};
}

function collapseMap(
	baseMap: Readonly<Record<string, string>> | undefined,
	envMap: Readonly<Record<string, string>> | undefined,
	propName: keyof NonNullable<Config['schema']>,
) {
	const result = { ...baseMap, ...envMap };

	if (Object.keys(result).length === 0) {
		return undefined;
	}

	return { [propName]: result };
}

function collapseAssets(
	baseAssets: NonNullable<Config['schema']>['assets'],
	envAssets: NonNullable<Config['schema']>['assets'],
) {
	const include = collapseList(baseAssets?.include, envAssets?.include);
	const exclude = collapseList(baseAssets?.exclude, envAssets?.exclude);

	const assets = {
		...(include ? { include } : {}),
		...(exclude ? { exclude } : {}),
	};

	return Object.keys(assets).length ? { assets } : undefined;
}

function collapseEntries(
	baseEntries: NonNullable<Config['schema']>['entries'],
	envEntries: NonNullable<Config['schema']>['entries'],
) {
	const include = collapseList(baseEntries?.include, envEntries?.include);
	const exclude = collapseList(baseEntries?.exclude, envEntries?.exclude);

	const entries = {
		...(include ? { include } : {}),
		...(exclude ? { exclude } : {}),
	};

	return Object.keys(entries).length ? { entries } : undefined;
}

function collapseLabels(
	baseLabels: NonNullable<Config['schema']>['labels'],
	envLabels: NonNullable<Config['schema']>['labels'],
) {
	const include = collapseList(baseLabels?.include, envLabels?.include);
	const exclude = collapseList(baseLabels?.exclude, envLabels?.exclude);

	const labels = {
		...(include ? { include } : {}),
		...(exclude ? { exclude } : {}),
	};

	return Object.keys(labels).length ? { labels } : undefined;
}

function collapseList(
	baseList: readonly string[] | undefined,
	envList: readonly string[] | undefined,
) {
	const result = [...(baseList ?? []), ...(envList ?? [])];
	return result.length ? result : undefined;
}
