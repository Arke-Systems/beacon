export default interface Options {
	readonly client: {
		readonly apiKey: string;
		readonly baseUrl: URL;
		readonly branch: string;
		readonly managementToken: string;
		readonly timeout: number;
	};
	readonly schema: {
		readonly assets: {
			readonly isIncluded: (path: string) => boolean;
		};
		readonly deletionStrategy: 'delete' | 'ignore' | 'warn';
		readonly entries: {
			readonly isIncluded: (contentTypeUid: string) => boolean;
		};
		readonly extension: {
			readonly byName: ReadonlyMap<string, string>;
			readonly byUid: ReadonlyMap<string, string>;
		};
		readonly jsonRtePlugin: {
			readonly byName: ReadonlyMap<string, string>;
			readonly byUid: ReadonlyMap<string, string>;
		};
		readonly schemaPath: string;
		readonly taxonomies: TaxonomyStrategies;
	};
	readonly verbose: boolean;
}

export type TaxonomyStrategy = 'only taxonomy' | 'taxonomy and terms';
export type TaxonomyStrategies = ReadonlyMap<string, TaxonomyStrategy>;

export const DefaultTaxonomyStrategies: TaxonomyStrategies = new Map([
	['*', 'taxonomy and terms'],
]);
