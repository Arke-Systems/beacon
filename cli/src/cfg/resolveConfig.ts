import type Options from '../ui/Options.js';
import type { PartialOptions } from '../ui/PartialOptions.js';
import UiOptions from '../ui/UiOptions.js';
import type { CliOptions } from './CliOptions.js';
import ConfigMissingError from './ConfigMissingError.js';
import { defaultValues } from './defaultValues.js';
import loadConfig from './loadConfig.js';
import removeDefaultValues from './removeDefaultValues.js';

export default async function resolveConfig(
	cliOptions: CliOptions,
): Promise<Options> {
	const withoutDefaults = removeDefaultValues(cliOptions);
	const { configFile } = withoutDefaults;

	if (configFile) {
		const fromConfigFile = await loadConfig(
			configFile,
			cliOptions.namedEnvironment,
		);

		return new UiOptions(defaultValues, fromConfigFile, withoutDefaults);
	}

	const fromConfig = await loadDefaultConfig(cliOptions.namedEnvironment);

	if (fromConfig) {
		return new UiOptions(defaultValues, fromConfig, withoutDefaults);
	}

	return new UiOptions(cliOptions);
}

async function loadDefaultConfig(
	namedEnvironment: string | undefined,
): Promise<PartialOptions | undefined> {
	try {
		return await loadConfig(defaultValues.configFile, namedEnvironment);
	} catch (ex: unknown) {
		if (ex instanceof ConfigMissingError) {
			return;
		}

		throw ex;
	}
}
