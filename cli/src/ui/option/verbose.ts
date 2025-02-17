import { Option } from 'commander';
import type Options from '../Options.js';

const verbose = new Option('--verbose', 'Increase verbosity');

export interface VerboseOption {
	readonly verbose?: Options['verbose'] | undefined;
}

export default verbose;
