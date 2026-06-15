import TestLogContext from '#test/integration/lib/TestLogContext.js';
import TestPushUiContext from '#test/integration/lib/TestPushUiContext.js';
import mockMergePlan from '#test/models/filters/mockMergePlan.js';
import { arrange, Theory } from '#test/models/filters/Theory.js';
import { inspect } from 'node:util';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type planPush from './planPush.js';

const logs = new TestLogContext();
const ui = new TestPushUiContext('fixtures/asset-filters', logs);
vi.doMock(import('../../lib/SchemaUi.js'), () => ({ default: () => ui }));

describe('Assets: planPush', () => {
	let sut: typeof planPush;

	beforeAll(async () => {
		sut = (await import('./planPush.js')).default;
	});

	afterEach(() => logs.clear());

	const theories: readonly Theory[] = [
		new Theory(true, true, true, true, 'skip'),
		new Theory(true, true, true, false, 'update'),
		new Theory(true, true, false, true, 'warning'),
		new Theory(true, true, false, false, 'warning'),
		new Theory(true, false, true, true, 'delete'),
		new Theory(true, false, true, false, 'delete'),
		new Theory(true, false, false, true, 'skip'),
		new Theory(true, false, false, false, 'skip'),
		new Theory(false, true, true, true, 'create'),
		new Theory(false, true, true, false, 'create'),
		new Theory(false, true, false, true, 'warning'),
		new Theory(false, true, false, false, 'warning'),
	];

	theories.forEach((theory) => {
		it(inspect(theory, { colors: true, compact: true }), () => {
			// Arrange
			const { cs, isIncluded, fs, itemPath } = arrange(theory);
			ui.options.schema.assets = { isIncluded };
			ui.options.verbose = theory.expected === 'warning';

			// Act
			const actual = sut(cs, fs);

			// Assert
			expect(actual).toEqual(mockMergePlan(theory, itemPath, fs, cs));

			if (theory.expected === 'warning') {
				expect(logs.warnings).toContainEqual(expect.stringContaining(itemPath));
			} else {
				expect(logs.warnings).not.toContainEqual(
					expect.stringContaining(itemPath),
				);
			}
		});
	});
});
