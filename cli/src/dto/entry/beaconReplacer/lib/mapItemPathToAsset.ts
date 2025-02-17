import resolveRawAssetItem from '#cli/cs/assets/lib/resolveRawAssetItem.js';
import { isRawAsset } from '#cli/cs/assets/Types.js';
import type BeaconReplacer from '../../BeaconReplacer.js';

export default function mapItemPathToAsset(
	this: BeaconReplacer,
	itemPath: string,
) {
	const result = resolveRawAssetItem(this.ctx.cs.assets.byParentUid, itemPath);

	if (!result) {
		throw new Error(`Could not find asset ${itemPath}.`);
	}

	if (!isRawAsset(result)) {
		throw new Error(`Expected ${itemPath} to be an asset.`);
	}

	return result;
}
