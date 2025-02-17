import { Option } from 'commander';
import type Options from '../Options.js';
import mapParser from '../parser/mapParser.js';

const jsonRtePlugin = new Option(
	'--json-rte-plugin [name:uid...]',
	'Map a named JSON RTE Plugin to a stack-specific UID.',
);

jsonRtePlugin.env('Beacon_Plugin').argParser(mapParser);

export interface JsonRtePluginOption {
	readonly jsonRtePlugin?: Options['schema']['jsonRtePlugin'] | undefined;
}

export default jsonRtePlugin;
