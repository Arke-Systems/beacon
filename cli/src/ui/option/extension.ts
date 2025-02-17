import { Option } from 'commander';
import type Options from '../Options.js';
import mapParser from '../parser/mapParser.js';

const extension = new Option(
	'--extension [name:uid...]',
	'Map a named extension to a stack-specific UID.',
);

extension.env('Beacon_Extension').argParser(mapParser);

export interface ExtensionOption {
	readonly extension?: Options['schema']['extension'] | undefined;
}

export default extension;
