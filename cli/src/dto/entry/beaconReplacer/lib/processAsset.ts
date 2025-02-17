import type BeaconReplacer from '../../BeaconReplacer.js';

export default function processAsset(
	this: BeaconReplacer,
	assetItemPath: string,
) {
	const asset = this.mapItemPathToAsset(assetItemPath);
	return { ...asset, ACL: [] };
}
