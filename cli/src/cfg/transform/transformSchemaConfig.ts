import type { PartialOptions } from '../../ui/PartialOptions.js';
import type { Config } from '../Config.schema.yaml';
import compileFilters from './compileFilters.js';

export default function transformSchemaConfig(
	baseSchema: Config['schema'],
	envSchema: Config['schema'],
): PartialOptions['schema'] {
	const schema = {
		...baseSchema,
		...envSchema,
		...collapseMap(baseSchema?.extension, envSchema?.extension, 'extension'),
		...collapseMap(baseSchema?.taxonomies, envSchema?.taxonomies, 'taxonomies'),
		...collapseAssets(baseSchema?.assets, envSchema?.assets),
		...collapseEntries(baseSchema?.entries, envSchema?.entries),

		...collapseMap(
			baseSchema?.['json-rte-plugin'],
			envSchema?.['json-rte-plugin'],
			'json-rte-plugin',
		),
	};

	const {
		assets,
		'deletion-strategy': strategy,
		entries,
		extension,
		'json-rte-plugin': jsonRtePlugin,
		'schema-path': schemaPath,
		taxonomies,
	} = schema;

	const result = {
		...(assets ? { assets: { isIncluded: compileFilters(assets) } } : {}),
		...(strategy ? { deletionStrategy: strategy } : {}),
		...(entries ? { entries: { isIncluded: compileFilters(entries) } } : {}),
		...(extension ? { extension: transformMap(extension) } : {}),
		...(jsonRtePlugin ? { jsonRtePlugin: transformMap(jsonRtePlugin) } : {}),
		...(schemaPath ? { schemaPath } : {}),
		...(taxonomies ? { taxonomies: new Map(Object.entries(taxonomies)) } : {}),
	};

	return Object.keys(result).length ? result : undefined;
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

function collapseList(
	baseList: readonly string[] | undefined,
	envList: readonly string[] | undefined,
) {
	const result = [...(baseList ?? []), ...(envList ?? [])];
	return result.length ? result : undefined;
}
