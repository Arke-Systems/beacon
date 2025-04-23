import { describe, expect, it } from 'vitest';
import isEmptyJsonRTEValue from './isEmptyJsonRTEValue.js';

describe(isEmptyJsonRTEValue.name, () => {
	const theories: readonly Theory[] = [
		new Theory(true, 'is empty with no children', []),

		new Theory(true, 'is empty with one empty child', [
			{
				attrs: {},
				children: [{ text: '' }],
				type: 'p',
				uid: 'unique-id',
			},
		]),

		new Theory(false, 'has multiple children', [
			{
				attrs: {},
				children: [{ text: '' }],
				type: 'p',
				uid: 'unique-id',
			},
			{
				attrs: {},
				children: [{ text: '' }],
				type: 'p',
				uid: 'unique-id',
			},
		]),

		new Theory(false, 'has multiple descendants', [
			{
				attrs: {},
				children: [{ text: '' }, { text: 'extra' }],
				type: 'p',
				uid: 'unique-id',
			},
		]),

		new Theory(false, 'has non-empty text in child', [
			{
				attrs: {},
				children: [{ text: 'not empty' }],
				type: 'p',
				uid: 'unique-id',
			},
		]),

		new Theory(false, 'has non-paragraph type', [
			{
				attrs: {},
				children: [{ text: '' }],
				type: 'div',
				uid: 'unique-id',
			},
		]),
	];

	theories.forEach((theory) => {
		it(`returns ${theory.expected} when the value ${theory.name}.`, () => {
			// Arrange
			const value = {
				_version: 1,
				attrs: {},
				children: theory.content,
				type: 'doc',
				uid: '07cc2e39fcc94427ae255b8e5f32fce2',
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
