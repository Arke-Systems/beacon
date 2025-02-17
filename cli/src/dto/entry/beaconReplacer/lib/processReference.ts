import parseReferencePath from '#cli/cs/entries/parseReferencePath.js';
import type { ReferencePath } from '#cli/cs/entries/Types.js';
import type BeaconReplacer from '../../BeaconReplacer.js';

export default function processReference(
	this: BeaconReplacer,
	targetPath: ReferencePath,
) {
	const { refPath } = this;

	if (!refPath) {
		throw new Error('No reference path.');
	}

	return {
		_content_type_uid: parseReferencePath(targetPath).contentTypeUid,
		uid: this.ctx.references.findReferencedUid(refPath, targetPath),
	};
}
