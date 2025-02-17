import { Option } from 'commander';
import type Options from '../Options.js';
import noEmptyStringsFor from '../parser/noEmptyStringsFor.js';

const managementToken = new Option(
	'--management-token [token]',
	'Contentstack management token',
);

managementToken
	.env('Contentstack_Management_Token')
	.makeOptionMandatory()
	.argParser(noEmptyStringsFor('Management token'));

export interface ManagementTokenOption {
	readonly managementToken: Options['client']['managementToken'];
}

export default managementToken;
