import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import type { TestAPI, TestFunction } from 'vitest';
import type { TestFixtures } from '../../lib/TestContext.js';
import TestContext from '../../lib/TestContext.js';

export interface WorkflowFixtures extends TestFixtures {
	readonly assets: Map<string, RawAssetItem>;
}

export type WorkflowTest = WorkflowTestContext['test'];

export default class WorkflowTestContext extends TestContext {
	public readonly assets = new Map<string, RawAssetItem>();

	readonly #workflowTest: TestAPI<WorkflowFixtures>;

	public constructor() {
		super('fixtures/developer-workflow');

		type NewFixtureNames = Exclude<keyof WorkflowFixtures, keyof TestFixtures>;
		type NewFixtures = Pick<WorkflowFixtures, NewFixtureNames>;

		this.#workflowTest = this._test.extend<NewFixtures>({
			assets: async ({}, use) => {
				await use(this.assets);
			},
		});
	}

	public override test(name: string, testFn: TestFunction<WorkflowFixtures>) {
		this.#workflowTest(name, testFn);
	}
}
