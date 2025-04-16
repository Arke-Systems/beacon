import { Option } from 'commander';
import type Options from '../Options.js';
import noEmptyStringsFor from '../parser/noEmptyStringsFor.js';

const apiKey = new Option('--api-key [key]', 'Contentstack API key');

apiKey.env('Contentstack_Api_Key').argParser(noEmptyStringsFor('API key'));

export interface ApiKeyOption {
	readonly apiKey: Options['client']['apiKey'];
}

export default apiKey;
