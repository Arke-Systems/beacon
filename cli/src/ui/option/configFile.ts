import { Option } from 'commander';
import { resolve } from 'node:path';

const configFile = new Option(
	'--config-file [path]',
	'Configuration file path',
);

export const defaultValue = './beacon.yaml';

configFile
	.default(defaultValue)
	.argParser((path) => resolve(path ? path : defaultValue));

export interface ConfigFileOption {
	readonly configFile: string;
}

export default configFile;
