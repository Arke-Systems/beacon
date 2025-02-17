import { createClient } from '#cli/cs/api/Client.js';
import pushJob from '#cli/schema/push.js';
import createStylus from '#cli/ui/createStylus.js';
import HandledError from '#cli/ui/HandledError.js';
import humanizePath from '#cli/ui/humanizePath.js';
import logApiPerformance from '#cli/ui/logApiPerformance.js';
import logResults from '#cli/ui/logResults.js';
import * as Options from '#cli/ui/option/index.js';
import { ConsoleUiContext } from '#cli/ui/UiContext.js';
import { Command } from 'commander';
import { resolve } from 'node:path';
import resolveConfig from '../../cfg/resolveConfig.js';
import { Store } from '../../schema/lib/SchemaUi.js';
import SchemaOperationError from '../../schema/SchemaOperationError.js';

const push = new Command('push');

push
	.addOption(Options.apiKey)
	.addOption(Options.baseUrl)
	.addOption(Options.branch)
	.addOption(Options.deletionStrategy)
	.addOption(Options.extension)
	.addOption(Options.jsonRtePlugin)
	.addOption(Options.managementToken)
	.addOption(Options.schemaPath)
	.addOption(Options.verbose)
	.description('Deploy serialized data and schema into a stack.');

type CommandOptions = Options.ApiKeyOption &
	Options.BaseUrlOption &
	Options.BranchOption &
	Options.DeletionStrategyOption &
	Options.ExtensionOption &
	Options.JsonRtePluginOption &
	Options.ManagementTokenOption &
	Options.SchemaPathOption &
	Options.VerboseOption;

push.action(async (options: CommandOptions) =>
	HandledError.ExitIfThrown(async () => {
		using ui = new ConsoleUiContext(await mapOptions(options));
		const b = createStylus('bold');
		const y = createStylus('yellowBright');

		const msg1 = 'Transfering schema from ';
		const msg2 = y`${humanizePath(resolve(options.schemaPath))} into `;
		const msg3 = y`${options.apiKey} (${options.branch})...`;
		ui.info(b`\n${msg1 + msg2 + msg3}\n`);

		const { histogram, results } = await Store.run(ui, async () => {
			await using client = createClient(ui);
			const r = await pushJob(client);
			return { histogram: client.performance, results: r };
		});

		ui.stopAllBars();
		logResults(ui, results);
		logApiPerformance(ui, histogram);
		SchemaOperationError.throwIfFailuresExist(results.values());
	}),
);

export default push;

async function mapOptions(options: CommandOptions) {
	return resolveConfig({
		client: {
			apiKey: options.apiKey,
			baseUrl: options.baseUrl,
			branch: options.branch,
			managementToken: options.managementToken,
		},
		schema: {
			deletionStrategy: options.deletionStrategy,
			extension: options.extension,
			jsonRtePlugin: options.jsonRtePlugin,
			schemaPath: options.schemaPath,
		},
		verbose: options.verbose,
	});
}
