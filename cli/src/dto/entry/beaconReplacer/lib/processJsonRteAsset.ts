import type BeaconReplacer from '../../BeaconReplacer.js';

export default function processJsonRteAsset(
	this: BeaconReplacer,
	value: Record<string, unknown>,
	jsonRteItemPath: string,
) {
	const asset = this.mapItemPathToAsset(jsonRteItemPath);

	const { $beacon: _, ...rest } = value;

	return this.processObject({
		...rest,
		'asset-uid': asset.uid,
		'content-type-uid': 'sys_assets',
	});
}
