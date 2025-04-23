import { describe, expect, it } from 'vitest';
import isEmptyJsonRTEValue from './isEmptyJsonRTEValue.js';

describe(isEmptyJsonRTEValue.name, () => {
	const theories: readonly Theory[] = [
		new Theory(true, 'is empty with no children', []),

		new Theory(true, 'is empty with one empty child', [
			{
				type: 'p',
				attrs: {},
				uid: 'unique-id',
				children: [{ text: '' }],
			},
		]),

		new Theory(false, 'has multiple children', [
			{
				type: 'p',
				attrs: {},
				uid: 'unique-id',
				children: [{ text: '' }],
			},
			{
				type: 'p',
				attrs: {},
				uid: 'unique-id',
				children: [{ text: '' }],
			},
		]),

		new Theory(false, 'has multiple descendants', [
			{
				type: 'p',
				attrs: {},
				uid: 'unique-id',
				children: [{ text: '' }, { text: 'extra' }],
			},
		]),

		new Theory(false, 'has non-empty text in child', [
			{
				type: 'p',
				attrs: {},
				uid: 'unique-id',
				children: [{ text: 'not empty' }],
			},
		]),

		new Theory(false, 'has non-paragraph type', [
			{
				type: 'div',
				attrs: {},
				uid: 'unique-id',
				children: [{ text: '' }],
			},
		]),
	];

	theories.forEach((theory) => {
		it(`returns ${theory.expected} when the value ${theory.name}.`, () => {
			// Arrange
			const value = {
				type: 'doc',
				attrs: {},
				uid: '07cc2e39fcc94427ae255b8e5f32fce2',
				children: theory.content,
				_version: 1,
			};

			const result = isEmptyJsonRTEValue(value);
			expect(result).toBe(theory.expected);
		});
	});
});

class Theory {
	public constructor(
		public readonly expected: boolean,
		public readonly name: string,
		public readonly content: readonly Record<string, unknown>[],
	) {}
}
