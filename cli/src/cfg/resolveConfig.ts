import type Options from '../ui/Options.js';
import type { PartialOptions } from '../ui/PartialOptions.js';
import UiOptions from '../ui/UiOptions.js';
import ConfigMissingError from './ConfigMissingError.js';
import { defaultValues } from './defaultValues.js';
import loadConfig from './loadConfig.js';
import removeDefaultValues from './removeDefaultValues.js';

export default async function resolveConfig(
	fromCommandEnvironment: PartialOptions,
): Promise<Options> {
	const { configFile } = fromCommandEnvironment;

	if (configFile) {
		const fromConfigFile = await loadConfig(configFile);
		const withoutDefaults = removeDefaultValues(fromCommandEnvironment);
		return new UiOptions(defaultValues, fromConfigFile, withoutDefaults);
	}

	const fromConfig = await loadDefaultConfig();

	if (fromConfig) {
		const withoutDefaults = removeDefaultValues(fromCommandEnvironment);
		return new UiOptions(defaultValues, fromConfig, withoutDefaults);
	}

	return new UiOptions(fromCommandEnvironment);
}

async function loadDefaultConfig(): Promise<PartialOptions | undefined> {
	try {
		return await loadConfig('./beacon.yaml');
	} catch (ex: unknown) {
		if (ex instanceof ConfigMissingError) {
			return;
		}

		throw ex;
	}
}
