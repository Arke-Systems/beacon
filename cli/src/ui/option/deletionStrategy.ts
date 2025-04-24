import { Option } from 'commander';
import type Options from '../Options.js';

const deletionStrategy = new Option(
	'--deletion-strategy [name]',
	'How to handle deletions in the target stack',
);

export const defaultValue = 'warn';

deletionStrategy
	.choices(['delete', 'ignore', 'warn'])
	.default(defaultValue)
	.argParser((value) => (value ? value : defaultValue));

export interface DeletionStrategyOption {
	readonly deletionStrategy: Options['schema']['deletionStrategy'];
}

export default deletionStrategy;
