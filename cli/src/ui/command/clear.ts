import resolveConfig from '#cli/cfg/resolveConfig.js';
import { createClient } from '#cli/cs/api/Client.js';
import clearJob from '#cli/schema/clear.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import HandledError from '#cli/ui/HandledError.js';
import logApiPerformance from '#cli/ui/logApiPerformance.js';
import { ConsoleUiContext } from '#cli/ui/UiContext.js';
import { Command } from 'commander';
import type { CommonOptions } from '../option/commonOptions.js';
import { addCommonOptions } from '../option/commonOptions.js';

const clear = new Command('clear');

addCommonOptions(clear);
clear.description('Empty all data from a stack.');

clear.action(async (options: CommonOptions) =>
	HandledError.ExitIfThrown(async () => {
		using ui = new ConsoleUiContext(await mapOptions(options));

		const b = createStylus('bold');
		ui.info(b`\n${'Emptying stack'}...`);

		const histogram = await Store.run(ui, async () => {
			await using client = createClient(ui);
			await clearJob(client, ui);
			return client.performance;
		});

		ui.stopAllBars();
		logApiPerformance(ui, histogram);
	}),
);

export default clear;

async function mapOptions(options: CommonOptions) {
	return resolveConfig({
		client: {
			apiKey: options.apiKey,
			baseUrl: options.baseUrl,
			branch: options.branch,
			managementToken: options.managementToken,
			timeout: options.apiTimeout,
		},
		configFile: options.configFile,
		schema: {
			deletionStrategy: 'delete',
		},
		verbose: options.verbose,
	});
}
