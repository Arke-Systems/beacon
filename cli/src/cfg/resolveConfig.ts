import type Options from '../ui/Options.js';
import type { PartialOptions } from '../ui/PartialOptions.js';
import UiOptions from '../ui/UiOptions.js';
import ConfigMissingError from './ConfigMissingError.js';
import loadConfig from './loadConfig.js';

export default async function resolveConfig(
	fromCommandEnvironment: PartialOptions,
): Promise<Options> {
	const { configFile } = fromCommandEnvironment;

	if (configFile) {
		const fromConfigFile = await loadConfig(configFile);
		return new UiOptions(fromConfigFile, fromCommandEnvironment);
	}

	const fromConfig = await loadDefaultConfig();

	return fromConfig
		? new UiOptions(fromConfig, fromCommandEnvironment)
		: new UiOptions(fromCommandEnvironment);
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
