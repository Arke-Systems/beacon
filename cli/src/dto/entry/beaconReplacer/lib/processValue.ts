import { isReferencePath } from '#cli/cs/entries/Types.js';
import isRecord from '#cli/util/isRecord.js';
import type BeaconReplacer from '../../BeaconReplacer.js';

export default function processValue(
	this: BeaconReplacer,
	value: unknown,
): unknown {
	if (Array.isArray(value)) {
		return value.map((v) => this.processValue(v));
	}

	if (!isRecord(value)) {
		return value;
	}

	const { $beacon } = value;
	if (!isRecord($beacon)) {
		return this.processObject(value);
	}

	const {
		asset: assetItemPath,
		jsonRteAsset: jsonRteItemPath,
		reference: targetPath,
	} = $beacon;

	if (typeof assetItemPath === 'string') {
		return this.processAsset(assetItemPath);
	}

	if (typeof jsonRteItemPath === 'string') {
		return this.processJsonRteAsset(value, jsonRteItemPath);
	}

	if (isReferencePath(targetPath)) {
		return this.processReference(targetPath);
	}

	throw new Error('Invalid $beacon');
}
