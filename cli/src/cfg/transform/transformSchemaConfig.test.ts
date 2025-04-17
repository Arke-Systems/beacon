import { describe, expect, it } from 'vitest';
import type { Config } from '../Config.schema.yaml';
import transformSchemaConfig from './transformSchemaConfig';

describe(transformSchemaConfig.name, () => {
	it('should merge baseSchema and envSchema correctly', () => {
		const baseSchema: Config['schema'] = {
			extension: { ext1: 'value1' },
			taxonomies: { tax1: 'only taxonomy' },
			assets: { include: ['asset1'], exclude: ['asset2'] },
		};

		const envSchema: Config['schema'] = {
			extension: { ext2: 'value2' },
			taxonomies: { tax2: 'taxonomy and terms' },
			assets: { include: ['asset3'], exclude: ['asset4'] },
		};

		const result = transformSchemaConfig(baseSchema, envSchema);

		if (!result) throw new Error('Result is undefined');

		expect(result.extension?.byName?.get('ext1')).toBe('value1');
		expect(result.extension?.byName?.get('ext2')).toBe('value2');
		expect(result.taxonomies?.get('tax1')).toBe('only taxonomy');
		expect(result.taxonomies?.get('tax2')).toBe('taxonomy and terms');
		expect(result.assets?.isIncluded?.('asset1')).toBe(true);
		expect(result.assets?.isIncluded?.('asset3')).toBe(true);
		expect(result.assets?.isIncluded?.('asset2')).toBe(false);
		expect(result.assets?.isIncluded?.('asset4')).toBe(false);
	});

	it('should handle empty schemas gracefully', () => {
		const baseSchema: Config['schema'] = {};
		const envSchema: Config['schema'] = {};

		const result = transformSchemaConfig(baseSchema, envSchema);

		expect(result).toEqual({});
	});

	it('should prioritize envSchema over baseSchema for overlapping keys', () => {
		const baseSchema: Config['schema'] = {
			extension: { key: 'baseValue' },
		};

		const envSchema: Config['schema'] = {
			extension: { key: 'envValue' },
		};

		const result = transformSchemaConfig(baseSchema, envSchema);

		if (!result) throw new Error('Result is undefined');

		expect(result.extension?.byName).toBeDefined();
		expect(result.extension?.byName?.get('key')).toBe('envValue');
	});
});
