import TestProjectUrl from '#test/util/TestProjectUrl.js';
import { describe, expect, it } from 'vitest';
import ConfigMissingError from './ConfigMissingError.js';
import ConfigurationError from './ConfigurationError.js';
import loadConfig from './loadConfig.js';

describe(loadConfig.name, () => {
	it('can load a valid configuration file', async () => {
		// Arrange
		const configPath = new URL(
			'fixtures/config/valid-config.yaml',
			TestProjectUrl,
		);

		// Act
		const result = await loadConfig(configPath);

		// Assert
		expect(result).toEqual({
			client: {
				apiKey: 'api key',
				baseUrl: new URL('https://example.com'),
				branch: 'branch name',
				managementToken: 'management token',
			},
			configFile: configPath,
			schema: {
				deletionStrategy: 'delete',
				extension: {
					byName: new Map<string, string>([
						['key1', 'value1'],
						['key2', 'value2'],
					]),
					byUid: new Map<string, string>([
						['value1', 'key1'],
						['value2', 'key2'],
					]),
				},
				jsonRtePlugin: {
					byName: new Map<string, string>([
						['key3', 'value3'],
						['key4', 'value4'],
					]),
					byUid: new Map<string, string>([
						['value3', 'key3'],
						['value4', 'key4'],
					]),
				},
				schemaPath: 'schema path',
				taxonomies: new Map([
					['tax_and_terms', 'taxonomy and terms'],
					['only_tax', 'only taxonomy'],
					['*', 'taxonomy and terms'],
				]),
			},
			verbose: true,
		});
	});

	it('throws a ConfigMissingError error for missing files', async () => {
		// Arrange
		const configPath = new URL(
			'fixtures/config/missing-config.yaml',
			TestProjectUrl,
		);

		// Act
		const attempt = async () => await loadConfig(configPath);

		// Assert
		await expect(attempt).rejects.toThrowError(ConfigMissingError);
	});

	it('throws a ConfigurationError for invalid files', async () => {
		// Arrange
		const configPath = new URL(
			'fixtures/config/invalid-config.yaml',
			TestProjectUrl,
		);

		// Act
		const attempt = async () => await loadConfig(configPath);

		// Assert
		await expect(attempt).rejects.toThrowError(ConfigurationError);
	});
});
