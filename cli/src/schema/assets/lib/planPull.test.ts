import TestLogContext from '#test/integration/lib/TestLogContext.js';
import TestPushUiContext from '#test/integration/lib/TestPushUiContext.js';
import mockMergePlan from '#test/models/filters/mockMergePlan.js';
import { arrange, Theory } from '#test/models/filters/Theory.js';
import { inspect } from 'node:util';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type planPull from './planPull.js';

const logs = new TestLogContext();
const ui = new TestPushUiContext('fixtures/asset-filters', logs);
vi.doMock(import('../../lib/SchemaUi.js'), () => ({ default: () => ui }));

describe('Assets: planPull', () => {
	let sut: typeof planPull;

	beforeAll(async () => {
		sut = (await import('./planPull.js')).default;
	});

	afterEach(() => logs.clear());

	const theories: readonly Theory[] = [
		new Theory(true, true, true, true, 'skip'),
		new Theory(true, true, true, false, 'update'),
		new Theory(true, true, false, true, 'skip'),
		new Theory(true, true, false, false, 'skip'),
		new Theory(true, false, true, true, 'create'),
		new Theory(true, false, true, false, 'create'),
		new Theory(true, false, false, true, 'skip'),
		new Theory(true, false, false, false, 'skip'),
		new Theory(false, true, true, true, 'delete'),
		new Theory(false, true, true, false, 'delete'),
		new Theory(false, true, false, true, 'skip'),
		new Theory(false, true, false, false, 'skip'),
	];

	theories.forEach((theory) => {
		it(inspect(theory, { colors: true, compact: true }), () => {
			// Arrange
			const { cs, isIncluded, fs, itemPath } = arrange(theory);
			ui.options.schema.assets = { isIncluded };

			// Act
			const actual = sut(cs, fs);

			// Assert
			expect(actual).toEqual(mockMergePlan(theory, itemPath, cs, fs));

			expect(logs.warnings).not.toContainEqual(
				expect.stringContaining(itemPath),
			);
		});
	});
});
