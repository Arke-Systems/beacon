import { describe, expect, it } from 'vitest';
import type Label from '../../cs/labels/Label.js';
import fromCs from './fromCs.js';
import { isNormalizedLabel, key } from './NormalizedLabel.js';
import toCs from './toCs.js';

describe('NormalizedLabel', () => {
	describe('fromCs', () => {
		it('should transform a label from Contentstack format', () => {
			const csLabel: Label = {
				content_types: ['page_general_page', 'page_article_page'],
				name: 'Page',
				uid: 'blt0d1abc79e3a6965f',
			};

			const normalized = fromCs(csLabel);

			expect(normalized.label.name).toBe('Page');
			expect(normalized.label.uid).toBeUndefined();
			expect(normalized.label.content_types).toEqual([
				'page_general_page',
				'page_article_page',
			]);
		});

		it('should omit empty arrays', () => {
			const csLabel: Label = {
				content_types: [],
				name: 'Empty Label',
				parent: [],
				uid: 'blt1234567890abcdef',
			};

			const normalized = fromCs(csLabel);

			expect(normalized.label.content_types).toBeUndefined();
			expect(normalized.label.parent).toBeUndefined();
		});

		it('should transform parent UIDs to label name references', () => {
			const csLabel: Label = {
				content_types: ['calculator_type_a'],
				name: 'Calculator',
				parent: ['blt7ed47981fb68dfb8'],
				uid: 'blt1234567890abcdef',
			};

			const uidToName = new Map([
				['blt7ed47981fb68dfb8', 'Component'],
				['blt1234567890abcdef', 'Calculator'],
			]);

			const normalized = fromCs(csLabel, uidToName);

			expect(normalized.label.name).toBe('Calculator');
			expect(normalized.label.parent).toEqual(['labels/Component']);
			expect(normalized.label.content_types).toEqual(['calculator_type_a']);
		});

		it('should throw error if parent UID cannot be resolved', () => {
			const csLabel: Label = {
				name: 'Calculator',
				parent: ['blt_unknown_uid'],
				uid: 'blt1234567890abcdef',
			};

			const uidToName = new Map([['blt1234567890abcdef', 'Calculator']]);

			expect(() => fromCs(csLabel, uidToName)).toThrow(
				'Cannot resolve parent label UID blt_unknown_uid to name',
			);
		});

		it('should keep UIDs as-is if no mapping provided (backward compat)', () => {
			const csLabel: Label = {
				name: 'Calculator',
				parent: ['blt7ed47981fb68dfb8'],
				uid: 'blt1234567890abcdef',
			};

			const normalized = fromCs(csLabel);

			expect(normalized.label.parent).toEqual(['blt7ed47981fb68dfb8']);
		});
	});

	describe('toCs', () => {
		it('should convert normalized label to CS format without UID', () => {
			const normalized = {
				label: {
					content_types: ['component_hero', 'component_cta'],
					name: 'Component',
				},
			};

			const csLabel = toCs(normalized);

			expect(csLabel.name).toBe('Component');
			expect('uid' in csLabel).toBe(false);
			expect(csLabel.content_types).toEqual([
				'component_hero',
				'component_cta',
			]);
		});

		it('should include UID when provided', () => {
			const normalized = {
				label: {
					content_types: ['component_hero'],
					name: 'Component',
				},
			};

			const csLabel = toCs(normalized, undefined, 'blt9876543210fedcba');

			expect(csLabel.name).toBe('Component');
			expect((csLabel as Label).uid).toBe('blt9876543210fedcba');
		});

		it('should convert parent name references to UIDs', () => {
			const normalized = {
				label: {
					content_types: ['calculator_type_a'],
					name: 'Calculator',
					parent: ['labels/Component'],
				},
			};

			const nameToUid = new Map([
				['Component', 'blt7ed47981fb68dfb8'],
				['Calculator', 'blt1234567890abcdef'],
			]);

			const csLabel = toCs(normalized, nameToUid);

			expect(csLabel.name).toBe('Calculator');
			expect(csLabel.parent).toEqual(['blt7ed47981fb68dfb8']);
		});

		it('should throw error if parent label name cannot be resolved', () => {
			const normalized = {
				label: {
					name: 'Calculator',
					parent: ['labels/UnknownLabel'],
				},
			};

			const nameToUid = new Map([['Calculator', 'blt1234567890abcdef']]);

			expect(() => toCs(normalized, nameToUid)).toThrow(
				'Cannot resolve parent label name "UnknownLabel" to UID',
			);
		});

		it('should keep UIDs as-is if no mapping provided (backward compat)', () => {
			const normalized = {
				label: {
					name: 'Calculator',
					parent: ['blt7ed47981fb68dfb8'],
				},
			};

			const csLabel = toCs(normalized);

			expect(csLabel.parent).toEqual(['blt7ed47981fb68dfb8']);
		});

		it('should handle mixed format parent references (backward compat)', () => {
			const normalized = {
				label: {
					name: 'Calculator',
					parent: ['labels/Component', 'blt_some_direct_uid'],
				},
			};

			const nameToUid = new Map([
				['Component', 'blt7ed47981fb68dfb8'],
				['Calculator', 'blt1234567890abcdef'],
			]);

			const csLabel = toCs(normalized, nameToUid);

			expect(csLabel.parent).toEqual([
				'blt7ed47981fb68dfb8',
				'blt_some_direct_uid',
			]);
		});
	});

	describe('key', () => {
		it('should use name as the key', () => {
			const normalized = {
				label: {
					content_types: ['test_type'],
					name: 'Test Label',
				},
			};

			expect(key(normalized)).toBe('Test Label');
		});
	});

	describe('isNormalizedLabel', () => {
		it('should accept valid label without UID', () => {
			const value = {
				label: {
					content_types: ['type1', 'type2'],
					name: 'Valid Label',
				},
			};

			expect(isNormalizedLabel(value)).toBe(true);
		});

		it('should accept valid label with UID', () => {
			const value = {
				label: {
					content_types: ['type1'],
					name: 'Valid Label',
					uid: 'blt1234567890abcdef',
				},
			};

			expect(isNormalizedLabel(value)).toBe(true);
		});

		it('should reject invalid label', () => {
			const value = {
				label: {
					content_types: ['type1'],
				},
			};

			expect(isNormalizedLabel(value)).toBe(false);
		});
	});
});
