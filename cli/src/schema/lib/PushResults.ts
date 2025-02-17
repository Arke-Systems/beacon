import type TransferResults from '../xfer/TransferResults.js';

export default class PushResults {
	readonly #results = new Map<string, PromiseSettledResult<TransferResults>>();

	public get value(): ReadonlyMap<
		string,
		PromiseSettledResult<TransferResults>
	> {
		return this.#results;
	}

	public async set(name: string, promise: Promise<TransferResults>) {
		const [result] = await Promise.allSettled([promise]);
		this.#results.set(name, result);
	}
}
