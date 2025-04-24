import { Option } from 'commander';

const environment = new Option('--environment [name]', 'Named environment');

export interface EnvironmentOption {
	readonly environment?: string;
}

export default environment;
