import { describe, expect, it } from 'vitest';
import UiOptions from './UiOptions.js';

describe('UiOptions', () => {
	it('overrides client and schema with environment values', () => {
		// Arrange
		const defaultValues = {
			client: { branch: 'main', timeout: 1000 },
			schema: { deletionStrategy: 'warn' as const, schemaPath: 'default-path' },
		};

		const fromConfigFile = {
			client: {
				apiKey: 'dev-key',
				baseUrl: new URL('https://dev.com'),
				branch: 'dev-branch',
				timeout: 5000,
			},
			schema: { schemaPath: 'dev-path' },
		};

		const fromCommandEnvironment = {
			client: {
				managementToken: 'cli-token',
				timeout: 10000,
			},
			schema: { schemaPath: 'cli-path' },
		};

		// Act
		const options = new UiOptions(
			defaultValues,
			fromConfigFile,
			fromCommandEnvironment,
		);

		// Assert
		expect(options.client.apiKey).toBe('dev-key');
		expect(options.client.baseUrl).toEqual(new URL('https://dev.com'));
		expect(options.client.branch).toBe('dev-branch');
		expect(options.client.managementToken).toBe('cli-token');
		expect(options.client.timeout).toBe(fromCommandEnvironment.client.timeout);
		expect(options.schema.schemaPath).toBe('cli-path');
	});
});
