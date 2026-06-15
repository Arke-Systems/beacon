/* eslint-disable sort-keys, @typescript-eslint/no-empty-function, @typescript-eslint/require-await, @typescript-eslint/no-unused-vars */
import type NormalizedLabel from '#cli/dto/label/NormalizedLabel.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Ctx from '../ctx/Ctx.js';
import type toContentstack from './toContentstack.js';
import type getUi from '../lib/SchemaUi.js';

const mockUi = {
	options: {
		schema: {
			labels: {
				isIncluded: () => true,
			},
			deletionStrategy: 'delete' as const,
		},
	},
	createProgressBar: () => ({
		increment: vi.fn(),
		update: vi.fn(),
		[Symbol.dispose]: () => {},
	}),
} as unknown as ReturnType<typeof getUi>;

vi.doMock(import('../lib/SchemaUi.js'), () => ({ default: () => mockUi }));

let sut: typeof toContentstack;

describe('Labels: toContentstack', () => {
	beforeEach(async () => {
		// Reset the mock before each test
		vi.resetModules();
		sut = (await import('./toContentstack.js')).default;
	});

	it('should only process labels that pass the isIncluded filter', async () => {
		// Arrange
		const label1: NormalizedLabel = {
			label: { name: 'production' },
		};
		const label2: NormalizedLabel = {
			label: { name: 'staging' },
		};
		const label3: NormalizedLabel = {
			label: { name: 'deprecated_old' },
		};

		const fsLabels = new Map<string, NormalizedLabel>([
			['production', label1],
			['staging', label2],
			['deprecated_old', label3],
		]);

		const csLabels = new Map<string, NormalizedLabel>();

		// Mock the isIncluded filter to exclude labels starting with 'deprecated_'
		const customMockUi = {
			...mockUi,
			options: {
				schema: {
					labels: {
						isIncluded: (labelName: string) =>
							!labelName.startsWith('deprecated_'),
					},
					deletionStrategy: 'delete' as const,
				},
			},
			// eslint-disable-next-line @typescript-eslint/consistent-type-imports
		} as unknown as ReturnType<typeof import('../lib/SchemaUi.js').default>;

		vi.doMock('../lib/SchemaUi.js', () => ({
			default: () => customMockUi,
		}));

		vi.resetModules();
		const sutWithCustomMock = (await import('./toContentstack.js')).default;

		const createdLabels: string[] = [];
		const ctx: Ctx = {
			fs: {
				labels: { byName: fsLabels },
			},
			cs: {
				labels: {
					byName: csLabels,
					create: vi.fn(async (label: NormalizedLabel) => {
						createdLabels.push(label.label.name);
					}),
					update: vi.fn(),
					remove: vi.fn(),
				},
			},
		} as unknown as Ctx;

		// Act
		await sutWithCustomMock(ctx);

		// Assert
		expect(createdLabels).toEqual(['production', 'staging']);
		expect(createdLabels).not.toContain('deprecated_old');
		// eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/no-magic-numbers
		expect(ctx.cs.labels.create).toHaveBeenCalledTimes(2);
	});

	it('should only remove labels that pass the isIncluded filter', async () => {
		// Arrange
		const label1: NormalizedLabel = {
			label: { name: 'production' },
		};
		const label2: NormalizedLabel = {
			label: { name: 'deprecated_old' },
		};

		const fsLabels = new Map<string, NormalizedLabel>();
		const csLabels = new Map<string, NormalizedLabel>([
			['production', label1],
			['deprecated_old', label2],
		]);

		// Mock the isIncluded filter
		const customMockUi2 = {
			...mockUi,
			options: {
				schema: {
					labels: {
						isIncluded: (labelName: string) =>
							!labelName.startsWith('deprecated_'),
					},
					deletionStrategy: 'delete' as const,
				},
			},
			// eslint-disable-next-line @typescript-eslint/consistent-type-imports
		} as unknown as ReturnType<typeof import('../lib/SchemaUi.js').default>;

		vi.doMock('../lib/SchemaUi.js', () => ({
			default: () => customMockUi2,
		}));

		vi.resetModules();
		const sutWithCustomMock2 = (await import('./toContentstack.js')).default;

		const removedLabels: string[] = [];
		const ctx: Ctx = {
			fs: {
				labels: { byName: fsLabels },
			},
			cs: {
				labels: {
					byName: csLabels,
					create: vi.fn(),
					update: vi.fn(),
					remove: vi.fn(async (label: NormalizedLabel) => {
						removedLabels.push(label.label.name);
					}),
				},
			},
		} as unknown as Ctx;

		// Act
		await sutWithCustomMock2(ctx);

		// Assert
		expect(removedLabels).toEqual(['production']);
		expect(removedLabels).not.toContain('deprecated_old');
		// eslint-disable-next-line @typescript-eslint/unbound-method
		expect(ctx.cs.labels.remove).toHaveBeenCalledTimes(1);
	});

	it('should only update labels that pass the isIncluded filter', async () => {
		// Arrange
		const fsLabel1: NormalizedLabel = {
			label: { name: 'production', uid: 'uid1' },
		};
		const csLabel1: NormalizedLabel = {
			label: { name: 'production' },
		};
		const fsLabel2: NormalizedLabel = {
			label: { name: 'deprecated_old', uid: 'uid2' },
		};
		const csLabel2: NormalizedLabel = {
			label: { name: 'deprecated_old' },
		};

		const fsLabels = new Map<string, NormalizedLabel>([
			['production', fsLabel1],
			['deprecated_old', fsLabel2],
		]);
		const csLabels = new Map<string, NormalizedLabel>([
			['production', csLabel1],
			['deprecated_old', csLabel2],
		]);

		// Mock the isIncluded filter
		const customMockUi3 = {
			...mockUi,
			options: {
				schema: {
					labels: {
						isIncluded: (labelName: string) =>
							!labelName.startsWith('deprecated_'),
					},
					deletionStrategy: 'delete' as const,
				},
			},
			// eslint-disable-next-line @typescript-eslint/consistent-type-imports
		} as unknown as ReturnType<typeof import('../lib/SchemaUi.js').default>;

		vi.doMock('../lib/SchemaUi.js', () => ({
			default: () => customMockUi3,
		}));

		vi.resetModules();
		const sutWithCustomMock3 = (await import('./toContentstack.js')).default;

		const updatedLabels: string[] = [];
		const ctx: Ctx = {
			fs: {
				labels: { byName: fsLabels },
			},
			cs: {
				labels: {
					byName: csLabels,
					create: vi.fn(),
					update: vi.fn(async (label: NormalizedLabel) => {
						updatedLabels.push(label.label.name);
					}),
					remove: vi.fn(),
				},
			},
		} as unknown as Ctx;

		// Act
		await sutWithCustomMock3(ctx);

		// Assert
		expect(updatedLabels).toEqual(['production']);
		expect(updatedLabels).not.toContain('deprecated_old');
		// eslint-disable-next-line @typescript-eslint/unbound-method
		expect(ctx.cs.labels.update).toHaveBeenCalledTimes(1);
	});
});
