import type Options from './Options.js';
import { DefaultTaxonomyStrategies } from './Options.js';
import type { PartialOptions } from './PartialOptions.js';
import { defaultValue as defaultTimeout } from './option/apiTimeout.js';
import { defaultValue as defaultBranch } from './option/branch.js';
import { defaultValue as defaultStrategy } from './option/deletionStrategy.js';
import { defaultValue as defaultSchemaPath } from './option/schemaPath.js';

export default class UiOptions implements Options {
	public readonly client: Options['client'];
	public readonly schema: Options['schema'];
	public readonly verbose: Options['verbose'];

	public constructor(...others: PartialOptions[]) {
		this.client = client(...others.map((o) => o.client));
		this.schema = schema(...others.map((o) => o.schema));

		const top = topLevel(...others);
		this.verbose = top.verbose;
	}
}

function topLevel(...others: PartialOptions[]) {
	const other = mergeExceptUndefined(...others);

	return {
		verbose: other.verbose ?? false,
	};
}

function client(...others: PartialOptions['client'][]): Options['client'] {
	const other = mergeExceptUndefined(...others);

	return {
		apiKey: other.apiKey ?? '',
		baseUrl: other.baseUrl ?? new URL('http://localhost'),
		branch: other.branch ?? defaultBranch,
		managementToken: other.managementToken ?? '',
		timeout: other.timeout ?? defaultTimeout,
	};
}

function schema(...others: PartialOptions['schema'][]): Options['schema'] {
	const other = mergeExceptUndefined(...others);

	return {
		assets: assets(...others.map((o) => o?.assets)),
		deletionStrategy: other.deletionStrategy ?? defaultStrategy,
		entries: entries(...others.map((o) => o?.entries)),
		extension: maps(...others.map((o) => o?.extension)),
		jsonRtePlugin: maps(...others.map((o) => o?.jsonRtePlugin)),
		schemaPath: other.schemaPath ?? defaultSchemaPath,
		taxonomies: other.taxonomies ?? DefaultTaxonomyStrategies,
	};
}

type AssetOptions = NonNullable<PartialOptions['schema']>['assets'];
function assets(...others: AssetOptions[]): Options['schema']['assets'] {
	const other = mergeExceptUndefined(...others);
	return { isIncluded: other.isIncluded ?? (() => true) };
}

type EntryOptions = NonNullable<PartialOptions['schema']>['entries'];
function entries(...others: EntryOptions[]): Options['schema']['entries'] {
	const other = mergeExceptUndefined(...others);
	return { isIncluded: other.isIncluded ?? (() => true) };
}

type MappedOptions = NonNullable<PartialOptions['schema']>['extension'];
function maps(...others: MappedOptions[]): Options['schema']['extension'] {
	const other = mergeExceptUndefined(...others);

	return {
		byName: other.byName ?? new Map<string, string>(),
		byUid: other.byUid ?? new Map<string, string>(),
	};
}

function mergeExceptUndefined<T extends Record<string, unknown>>(
	...others: (T | undefined)[]
): T {
	const valueIsDefined = ([, value]: [unknown, unknown]) => value !== undefined;

	const definedEntries = (x: Record<string, unknown>) =>
		Object.entries(x).filter(valueIsDefined);

	return Object.assign(
		{},
		...others.map((x) => (x ? Object.fromEntries(definedEntries(x)) : {})),
	) as T;
}
