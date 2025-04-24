import resolveConfig from '#cli/cfg/resolveConfig.js';
import { createClient } from '#cli/cs/api/Client.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import pushJob from '#cli/schema/push.js';
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
import logOptions from '../logOptions.js';
import type { CommonOptions } from '../option/commonOptions.js';
import { addCommonOptions } from '../option/commonOptions.js';

const push = new Command('push');
addCommonOptions(push);

push
	.addOption(Options.deletionStrategy)
	.addOption(Options.extension)
	.addOption(Options.jsonRtePlugin)
	.addOption(Options.schemaPath)
	.description('Deploy serialized data and schema into a stack.');

type CommandOptions = CommonOptions &
	Options.DeletionStrategyOption &
	Options.ExtensionOption &
	Options.JsonRtePluginOption &
	Options.SchemaPathOption;

push.action(async (cliOptions: CommandOptions) =>
	HandledError.ExitIfThrown(async () => {
		const options = await mapOptions(cliOptions);
		using ui = new ConsoleUiContext(options);
		ui.info(logStart(cliOptions, options));

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
			timeout: options.apiTimeout,
		},
		configFile: options.configFile,
		namedEnvironment: options.environment,
		schema: {
			deletionStrategy: options.deletionStrategy,
			extension: options.extension,
			jsonRtePlugin: options.jsonRtePlugin,
			schemaPath: options.schemaPath,
		},
		verbose: options.verbose,
	});
}

function logStart(
	cliOptions: CommandOptions,
	options: Awaited<ReturnType<typeof mapOptions>>,
) {
	const y = createStylus('yellowBright');

	const parts = [
		'\nSerializing schema from ',
		y`${humanizePath(resolve(options.schema.schemaPath))} into`,
	];

	if (cliOptions.environment) {
		parts.push(y` ${cliOptions.environment} (${options.client.apiKey})`);
	} else {
		parts.push(y` ${options.client.apiKey}`);
	}

	parts.push(
		y` on the ${options.client.branch} branch:\n`,
		logOptions(options),
	);

	return parts.join('');
}
