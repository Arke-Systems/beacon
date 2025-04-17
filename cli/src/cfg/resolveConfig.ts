import type { PathLike } from 'node:fs';
import type Options from '../ui/Options.js';
import type { PartialOptions } from '../ui/PartialOptions.js';
import UiOptions from '../ui/UiOptions.js';
import ConfigMissingError from './ConfigMissingError.js';
import { defaultValues } from './defaultValues.js';
import loadConfig from './loadConfig.js';
import removeDefaultValues from './removeDefaultValues.js';

type CliOptions = PartialOptions & {
	readonly configFile?: PathLike;
	readonly namedEnvironment?: string;
};

export default async function resolveConfig(
	cliOptions: CliOptions,
): Promise<Options> {
	const { configFile } = cliOptions;

	if (configFile) {
		const fromConfigFile = await loadConfig(
			configFile,
			cliOptions.namedEnvironment,
		);

		const withoutDefaults = removeDefaultValues(cliOptions);
		return new UiOptions(defaultValues, fromConfigFile, withoutDefaults);
	}

	const fromConfig = await loadDefaultConfig(cliOptions.namedEnvironment);

	if (fromConfig) {
		const withoutDefaults = removeDefaultValues(cliOptions);
		return new UiOptions(defaultValues, fromConfig, withoutDefaults);
	}

	return new UiOptions(cliOptions);
}

async function loadDefaultConfig(
	namedEnvironment: string | undefined,
): Promise<PartialOptions | undefined> {
	try {
		return await loadConfig('./beacon.yaml', namedEnvironment);
	} catch (ex: unknown) {
		if (ex instanceof ConfigMissingError) {
			return;
		}

		throw ex;
	}
}
