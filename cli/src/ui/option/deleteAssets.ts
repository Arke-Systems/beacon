import { Option } from 'commander';

const deleteAssets = new Option(
	'--delete-assets',
	'Delete all assets, ignoring asset filters. By default, only assets matching configured filters are deleted.',
);

export const defaultValue = false;

deleteAssets.default(defaultValue);

export interface DeleteAssetsOption {
	readonly deleteAssets: boolean;
}

export default deleteAssets;
