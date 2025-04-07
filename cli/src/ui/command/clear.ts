import { createClient } from '#cli/cs/api/Client.js';
import clearJob from '#cli/schema/clear.js';
import createStylus from '#cli/ui/createStylus.js';
import HandledError from '#cli/ui/HandledError.js';
import logApiPerformance from '#cli/ui/logApiPerformance.js';
import * as Options from '#cli/ui/option/index.js';
import { ConsoleUiContext } from '#cli/ui/UiContext.js';
import { Command } from 'commander';
import resolveConfig from '../../cfg/resolveConfig.js';
import { Store } from '../../schema/lib/SchemaUi.js';

const clear = new Command('clear');

clear
	.addOption(Options.apiTimeout)
	.addOption(Options.apiKey)
	.addOption(Options.baseUrl)
	.addOption(Options.branch)
	.addOption(Options.managementToken)
	.addOption(Options.verbose)
	.description('Empty all data from a stack.');

type CommandOptions = Options.ApiKeyOption &
	Options.ApiTimeoutOption &
	Options.BaseUrlOption &
	Options.BranchOption &
	Options.ManagementTokenOption &
	Options.VerboseOption;

clear.action(async (options: CommandOptions) =>
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

async function mapOptions(options: CommandOptions) {
	return resolveConfig({
		client: {
			apiKey: options.apiKey,
			baseUrl: options.baseUrl,
			branch: options.branch,
			managementToken: options.managementToken,
			timeout: options.apiTimeout,
		},
		schema: {
			deletionStrategy: 'delete',
		},
		verbose: options.verbose,
	});
}
