import type Client from '#cli/cs/api/Client.js';
import Ctx from './ctx/Ctx.js';
import pullModules from './lib/pullModules.js';
import type TransferResults from './xfer/TransferResults.js';

type Result = ReadonlyMap<string, PromiseSettledResult<TransferResults>>;

export default async function pull(client: Client): Promise<Result> {
	const names: string[] = [];
	const tasks = [];
	const ctx = await Ctx.prepare(client);

	for await (const [name, task] of pullModules(ctx)) {
		names.push(name);
		tasks.push(task);
	}

	const results = await Promise.allSettled(tasks);

	return results.reduce((map, result, index) => {
		const name = names[index];
		if (!name) {
			throw new Error('Could not resolve task name');
		}

		return map.set(name, result);
	}, new Map<string, PromiseSettledResult<TransferResults>>());
}
