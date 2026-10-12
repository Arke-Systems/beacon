import { Option } from 'commander';

const entries = new Option(
	'--no-entries',
	'Skip entry synchronization (content types are still synchronized)',
);

export interface EntriesOption {
	readonly entries?: boolean | undefined;
}

export default entries;
