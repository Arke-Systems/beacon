import resolveRawAssetItem from '#cli/cs/assets/lib/resolveRawAssetItem.js';
import { isRawAsset } from '#cli/cs/assets/Types.js';
import type BeaconReplacer from '../../BeaconReplacer.js';

export default function mapItemPathToAsset(
	this: BeaconReplacer,
	itemPath: string,
) {
	const result = resolveRawAssetItem(this.ctx.cs.assets.byParentUid, itemPath);

	if (!result) {
		// Check if asset exists in filesystem but not in Contentstack
		const fsAsset = this.ctx.fs.assets.assetsByPath.get(itemPath);

		if (fsAsset) {
			throw new Error(
				`Asset ${itemPath} exists in filesystem but not in Contentstack. ` +
					`Push assets first, or include them in the assets filter to push them automatically.`,
			);
		}

		throw new Error(`Could not find asset ${itemPath}.`);
	}

	if (!isRawAsset(result)) {
		throw new Error(`Expected ${itemPath} to be an asset.`);
	}

	return result;
}
