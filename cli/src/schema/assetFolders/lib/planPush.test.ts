import TestLogContext from '#test/integration/lib/TestLogContext.js';
import TestPushUiContext from '#test/integration/lib/TestPushUiContext.js';
import { inspect } from 'node:util';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type AssetMeta from '../../assets/AssetMeta.js';
import type FolderMeta from './FolderMeta.js';
import type planPush from './planPush.js';

const logs = new TestLogContext();
const ui = new TestPushUiContext('fixtures/asset-filters', logs);
vi.doMock(import('../../lib/SchemaUi.js'), () => ({ default: () => ui }));

describe('Asset Folders: planPush', () => {
	let sut: typeof planPush;

	beforeAll(async () => {
		sut = (await import('./planPush.js')).default;
	});

	afterEach(() => logs.clear());

	// See test/integration/asset-filters/asset-filters.cs.test.md

	// cs, fs, included, csChild, fsChild, expected
	const theories: readonly Theory[] = [
		new Theory(true, true, true, true, true, 'skip'),
		new Theory(true, true, true, true, false, 'skip'),
		new Theory(true, true, true, false, true, 'skip'),
		new Theory(true, true, true, false, false, 'skip'),
		new Theory(true, true, false, true, true, 'skip'),
		new Theory(true, true, false, true, false, 'warning'),
		new Theory(true, true, false, false, true, 'skip'),
		new Theory(true, true, false, false, false, 'warning'),
		new Theory(true, false, true, true, false, 'delete'),
		new Theory(true, false, true, false, false, 'delete'),
		new Theory(true, false, false, true, false, 'skip'),
		new Theory(true, false, false, false, false, 'skip'),
		new Theory(false, true, true, false, true, 'create'),
		new Theory(false, true, true, false, false, 'create'),
		new Theory(false, true, false, false, true, 'create'),
		new Theory(false, true, false, false, false, 'warning'),
	];

	theories.forEach((theory) => {
		it(inspect(theory, { colors: true, compact: true }), () => {
			// Arrange
			const { assets, cs, isIncluded, fs, itemPath } = arrange(theory);
			ui.options.schema.assets = { isIncluded };

			// Act
			const actual = sut(cs, fs, assets);

			// Assert
			if (theory.expected === 'create') {
				expect(actual.toCreate.keys()).toContain(itemPath);
			} else {
				expect(actual.toCreate.keys()).not.toContain(itemPath);
			}

			if (theory.expected === 'delete') {
				expect(actual.toRemove.keys()).toContain(itemPath);
			} else {
				expect(actual.toRemove.keys()).not.toContain(itemPath);
			}

			if (theory.expected === 'skip' || theory.expected === 'warning') {
				expect(actual.toSkip).toContain(itemPath);
			} else {
				expect(actual.toSkip).not.toContain(itemPath);
			}

			if (theory.expected === 'update') {
				expect(actual.toUpdate.keys()).toContain(itemPath);
			} else {
				expect(actual.toUpdate.keys()).not.toContain(itemPath);
			}

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

class Theory {
	public constructor(
		public readonly cs: boolean,
		public readonly fs: boolean,
		public readonly included: boolean,
		public readonly csChild: boolean,
		public readonly fsChild: boolean,
		public readonly expected:
			| 'create'
			| 'delete'
			| 'skip'
			| 'update'
			| 'warning',
	) {}
}

function arrange(theory: Theory) {
	const cs = new Map<string, FolderMeta>();
	const fs = new Map<string, FolderMeta>();
	const meta: FolderMeta = { itemPath: '/some/folder', name: 'folder' };
	const assets = new Map<string, AssetMeta>();

	if (theory.cs) {
		cs.set(meta.itemPath, meta);
	}

	if (theory.fs) {
		fs.set(meta.itemPath, meta);
	}

	if (theory.csChild) {
		const child = createChild();
		cs.set(child.itemPath, child);
	}

	if (theory.fsChild) {
		const childFolder = createChild();
		fs.set(childFolder.itemPath, childFolder);

		const child: AssetMeta = {
			fileSize: 123,
			itemPath: `${childFolder.itemPath}/file.txt`,
			tags: new Set(),
			title: 'file.txt',
		};

		assets.set(child.itemPath, child);
	}

	const isIncluded = (path: string) => {
		if (path === meta.itemPath) {
			return theory.included;
		}

		if (theory.csChild || theory.fsChild) {
			return path.startsWith('/some/folder/child/');
		}

		return false;
	};

	return { assets, cs, fs, isIncluded, itemPath: meta.itemPath };
}

function createChild(): FolderMeta {
	return {
		itemPath: '/some/folder/child/sub-folder',
		name: 'sub-folder',
	};
}
