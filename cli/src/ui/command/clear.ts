import resolveConfig from '#cli/cfg/resolveConfig.js';
import { createClient } from '#cli/cs/api/Client.js';
import clearJob from '#cli/schema/clear.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import HandledError from '#cli/ui/HandledError.js';
import logApiPerformance from '#cli/ui/logApiPerformance.js';
import { ConsoleUiContext } from '#cli/ui/UiContext.js';
import { Command } from 'commander';
import logOptions from '../logOptions.js';
import type { CommonOptions } from '../option/commonOptions.js';
import { addCommonOptions } from '../option/commonOptions.js';

const clear = new Command('clear');

addCommonOptions(clear);
clear.description('Empty all data from a stack.');

clear.action(async (cliOptions: CommonOptions) =>
	HandledError.ExitIfThrown(async () => {
		const options = await mapOptions(cliOptions);
		using ui = new ConsoleUiContext(options);
		ui.info(logStart(cliOptions, options));

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
		namedEnvironment: options.environment,
		schema: {
			deletionStrategy: 'delete',
		},
		verbose: options.verbose,
	});
}

function logStart(
	cliOptions: CommonOptions,
	options: Awaited<ReturnType<typeof mapOptions>>,
) {
	const b = createStylus('bold');
	const y = createStylus('yellowBright');
	const parts = [b`\n${'Emptying'} `];

	if (cliOptions.environment) {
		parts.push(y`${cliOptions.environment} (${options.client.apiKey}) `);
	} else {
		parts.push(y`${options.client.apiKey} `);
	}

	parts.push(
		b`${'stack on the'} `,
		y`${options.client.branch}`,
		b` ${'branch'}:\n`,
		logOptions(options),
	);

	return parts.join('');
}
