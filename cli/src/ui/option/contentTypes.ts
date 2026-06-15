import { Option } from 'commander';

const contentTypes = new Option(
	'--content-types <types...>',
	'Space-delimited list of content type UIDs to delete (removes both entries and the content types themselves)',
);

export const defaultValue: string[] = [];

contentTypes.default(defaultValue);

export interface ContentTypesOption {
	readonly contentTypes: string[];
}

export default contentTypes;
