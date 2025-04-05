import { Option } from 'commander';
import type Options from '../Options.js';

const branch = new Option('--branch [name]', 'Contentstack Branch');

export const defaultValue = 'main';

branch
	.env('Contentstack_Branch')
	.default(defaultValue)
	.argParser((value) => (value ? value : defaultValue))
	.makeOptionMandatory();

export interface BranchOption {
	readonly branch: Options['client']['branch'];
}

export default branch;
