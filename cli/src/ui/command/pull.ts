import resolveConfig from '#cli/cfg/resolveConfig.js';
import { createClient } from '#cli/cs/api/Client.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import pullJob from '#cli/schema/pull.js';
import SchemaOperationError from '#cli/schema/SchemaOperationError.js';
import createStylus from '#cli/ui/createStylus.js';
import HandledError from '#cli/ui/HandledError.js';
import humanizePath from '#cli/ui/humanizePath.js';
import logApiPerformance from '#cli/ui/logApiPerformance.js';
import logResults from '#cli/ui/logResults.js';
import * as Options from '#cli/ui/option/index.js';
import { ConsoleUiContext } from '#cli/ui/UiContext.js';
import { Command } from 'commander';
import { resolve } from 'node:path';

const pull = new Command('pull');

pull
	.addOption(Options.apiTimeout)
	.addOption(Options.apiKey)
	.addOption(Options.baseUrl)
	.addOption(Options.branch)
	.addOption(Options.environment)
	.addOption(Options.extension)
	.addOption(Options.jsonRtePlugin)
	.addOption(Options.managementToken)
	.addOption(Options.schemaPath)
	.addOption(Options.verbose)
	.description('Serialize data and schema from a stack into the file system.');

type CommandOptions = Options.ApiKeyOption &
	Options.ApiTimeoutOption &
	Options.BaseUrlOption &
	Options.BranchOption &
	Options.EnvironmentOption &
	Options.ExtensionOption &
	Options.JsonRtePluginOption &
	Options.ManagementTokenOption &
	Options.SchemaPathOption &
	Options.VerboseOption;

pull.action(async (options: CommandOptions) =>
	HandledError.ExitIfThrown(async () => {
		using ui = new ConsoleUiContext(await mapOptions(options));
		const b = createStylus('bold');
		const y = createStylus('yellowBright');

		const msg1 = y`Serializing schema from ${options.apiKey}`;
		const msg2 = y` (${options.branch}) into`;
		const msg3 = y` ${humanizePath(resolve(options.schemaPath))}...`;
		ui.info(b`\n${msg1 + msg2 + msg3}\n`);

		const { histogram, results } = await Store.run(ui, async () => {
			await using client = createClient(ui);
			const r = await pullJob(client);
			return { histogram: client.performance, results: r };
		});

		ui.stopAllBars();
		logResults(ui, results);
		logApiPerformance(ui, histogram);
		SchemaOperationError.throwIfFailuresExist(results.values());
	}),
);

export default pull;

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
			extension: options.extension,
			jsonRtePlugin: options.jsonRtePlugin,
			schemaPath: options.schemaPath,
		},
		verbose: options.verbose,
	});
}
