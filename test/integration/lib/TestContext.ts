import type Client from '#cli/cs/api/Client.js';
import { createClient } from '#cli/cs/api/Client.js';
import type LogContext from '#cli/ui/LogContext.js';
import TestPushUiContext from '#test/integration/lib/TestPushUiContext.js';
import TempFolder from '#test/util/TempFolder.js';
import TestProjectUrl from '#test/util/TestProjectUrl.js';
import { fileURLToPath } from 'node:url';
import { test, type TestFunction } from 'vitest';

export interface TestFixtures {
	readonly client: Client;
	readonly currentFixturePath: string;
	readonly originalFixturePath: string;
	readonly ui: TestPushUiContext;
}

export default class TestContext implements AsyncDisposable {
	public readonly client: Client;
	public readonly originalFixturePath: string;

	protected readonly _test = test.extend<TestFixtures>({
		client: async ({}, use) => {
			await use(this.client);
		},
		currentFixturePath: async ({}, use) => {
			await use(this.#currentFixturePath ?? this.originalFixturePath);
		},
		originalFixturePath: async ({}, use) => {
			await use(this.originalFixturePath);
		},
		ui: async ({}, use) => {
			await use(this.ui);
		},
	});

	readonly #originalUi: TestPushUiContext;
	#clonedFolder: TempFolder | undefined;
	#clonedUi: TestPushUiContext | undefined;
	#currentFixturePath: string | undefined;

	public constructor(
		fixture: string,
		private readonly logContext: LogContext = console,
	) {
		const fixtureUrl = new URL(fixture, TestProjectUrl);
		const fixturePath = fileURLToPath(fixtureUrl);
		this.originalFixturePath = fixturePath;
		this.#originalUi = new TestPushUiContext(fixturePath, logContext);
		this.client = createClient(this.#originalUi);
	}

	public get ui(): TestPushUiContext {
		return this.#clonedUi ?? this.#originalUi;
	}

	public test(
		name: string,
		testFn: TestFunction<TestFixtures>,
		timeout?: number,
	) {
		this._test(name, testFn, timeout);
	}

	public async createFixtureClone() {
		await this.#disposeClonedFixture();
		const tempPath = fileURLToPath(new URL('.tmp', TestProjectUrl));
		this.#clonedFolder = await TempFolder.create(tempPath);
		this.#currentFixturePath = this.#clonedFolder.absPath;

		this.#clonedUi = new TestPushUiContext(
			this.#currentFixturePath,
			this.logContext,
		);
	}

	public async [Symbol.asyncDispose]() {
		await Promise.allSettled([
			this.client[Symbol.asyncDispose](),
			this.#disposeClonedFixture(),
		]);
	}

	async #disposeClonedFixture() {
		await this.#clonedFolder?.[Symbol.asyncDispose]();
		this.#currentFixturePath = undefined;
		this.#clonedFolder = undefined;
	}
}
