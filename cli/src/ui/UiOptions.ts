import type Options from './Options.js';
import { DefaultTaxonomyStrategies } from './Options.js';
import type { PartialOptions } from './PartialOptions.js';

export default class UiOptions implements Options {
	public readonly client: Options['client'];
	public readonly configFile: Options['configFile'];
	public readonly schema: Options['schema'];
	public readonly verbose: Options['verbose'];

	public constructor(...others: PartialOptions[]) {
		this.client = client(...others.map((o) => o.client));
		this.schema = schema(...others.map((o) => o.schema));

		const top = topLevel(...others);
		this.configFile = top.configFile;
		this.verbose = top.verbose;
	}
}

function topLevel(...others: PartialOptions[]) {
	const other = Object.assign({}, ...others) as PartialOptions;

	return {
		configFile: other.configFile ?? '',
		verbose: other.verbose ?? false,
	};
}

function client(...others: PartialOptions['client'][]): Options['client'] {
	const other = Object.assign({}, ...others) as PartialOptions['client'];

	return {
		apiKey: other?.apiKey ?? '',
		baseUrl: other?.baseUrl ?? new URL('http://localhost'),
		branch: other?.branch ?? 'main',
		managementToken: other?.managementToken ?? '',
	};
}

function schema(...others: PartialOptions['schema'][]): Options['schema'] {
	const other = Object.assign({}, ...others) as PartialOptions['schema'];

	return {
		assets: assets(...others.map((o) => o?.assets)),
		deletionStrategy: other?.deletionStrategy ?? 'warn',
		extension: maps(...others.map((o) => o?.extension)),
		jsonRtePlugin: maps(...others.map((o) => o?.jsonRtePlugin)),
		schemaPath: other?.schemaPath ?? '',
		taxonomies: other?.taxonomies ?? DefaultTaxonomyStrategies,
	};
}

type AssetOptions = NonNullable<PartialOptions['schema']>['assets'];
function assets(...others: AssetOptions[]): Options['schema']['assets'] {
	const other = Object.assign({}, ...others) as AssetOptions;

	return { isIncluded: other?.isIncluded ?? (() => true) };
}

type MappedOptions = NonNullable<PartialOptions['schema']>['extension'];
function maps(...others: MappedOptions[]): Options['schema']['extension'] {
	const other = Object.assign({}, ...others) as MappedOptions;

	return {
		byName: other?.byName ?? new Map<string, string>(),
		byUid: other?.byUid ?? new Map<string, string>(),
	};
}
