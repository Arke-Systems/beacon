import readFixture from '#test/fixtures/readFixture';
import yaml from 'js-yaml';
import { expect, test, vi } from 'vitest';
import ContentstackError from './ContentstackError.js';

vi.mock(import('../../ui/HandledError.js'));

test('Correctly understands a Contentstack error response', async () => {
	// Arrange
	const errorYaml = await readFixture('error-response.yaml');
	const errorResponse = yaml.load(errorYaml);

	// Act
	const fn = () => ContentstackError.throwIfError(errorResponse, 'unit test');

	// Assert
	expect(fn).toThrowError(ContentstackError);
});
