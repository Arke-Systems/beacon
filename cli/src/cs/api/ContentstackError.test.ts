import readFixture from '#test/fixtures/readFixture';
import { expect, test, vi } from 'vitest';
import { parse } from 'yaml';
import ContentstackError from './ContentstackError.js';

vi.mock(import('../../ui/HandledError.js'));

test('Correctly understands a Contentstack error response', async () => {
	// Arrange
	const errorYaml = await readFixture('error-response.yaml');
	const errorResponse: unknown = parse(errorYaml);

	// Act
	const fn = () => ContentstackError.throwIfError(errorResponse, 'unit test');

	// Assert
	expect(fn).toThrowError(ContentstackError);
});
