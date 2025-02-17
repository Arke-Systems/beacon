import deleteFolder from '#cli/cs/assets/deleteFolder.js';
import type { RawAsset, RawFolder } from '#cli/cs/assets/Types.js';
import { randomUUID } from 'node:crypto';
import type { TestAPI, TestFunction } from 'vitest';
import type { TestFixtures } from '../../lib/TestContext.js';
import TestContext from '../../lib/TestContext.js';

interface State {
	readonly folderName: string;
	readonly subfolderName: string;
	parentFolder?: RawFolder | undefined;
	subFolder?: RawFolder | undefined;
	martin?: RawAsset | undefined;
	mattimeo?: RawAsset | undefined;
	mossflower?: RawAsset | undefined;
}

export interface AssetFixtures extends TestFixtures {
	readonly state: State;
}

export type AssetTest = AssetTestContext['test'];

export default class AssetTestContext
	extends TestContext
	implements AsyncDisposable
{
	readonly #state: State;
	readonly #assetTest: TestAPI<AssetFixtures>;

	public constructor() {
		super('fixtures/asset-tests');

		type NewFixtureNames = Exclude<keyof AssetFixtures, keyof TestFixtures>;
		type NewFixtures = Pick<AssetFixtures, NewFixtureNames>;

		this.#state = {
			folderName: randomUUID(),
			subfolderName: randomUUID(),
		};

		this.#assetTest = this._test.extend<NewFixtures>({
			state: async ({}, use) => {
				await use(this.#state);
			},
		});
	}

	public override test(name: string, testFn: TestFunction<AssetFixtures>) {
		this.#assetTest(name, testFn);
	}

	public override async [Symbol.asyncDispose]() {
		const { parentFolder } = this.#state;

		if (parentFolder) {
			await deleteFolder(this.client, parentFolder.uid);
		}

		await super[Symbol.asyncDispose]();
	}
}
