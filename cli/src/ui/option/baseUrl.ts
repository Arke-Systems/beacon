import { Option } from 'commander';
import type Options from '../Options.js';
import noEmptyStringsFor from '../parser/noEmptyStringsFor.js';

const baseUrl = new Option('--base-url [url]', 'Base URL');

// From https://www.contentstack.com/docs/developers/apis/content-management-api
baseUrl.choices([
	'https://api.contentstack.io/',
	'https://eu-api.contentstack.com/',
	'https://azure-na-api.contentstack.com/',
	'https://azure-eu-api.contentstack.com/',
]);

baseUrl
	.env('Contentstack_Management_API')
	.argParser(
		(val: string) => new URL(noEmptyStringsFor('Management API')(val)),
	);

export interface BaseUrlOption {
	readonly baseUrl: Options['client']['baseUrl'];
}

export default baseUrl;
