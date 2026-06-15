import type Label from '#cli/cs/labels/Label.js';
import isRecord from '#cli/util/isRecord.js';

export default interface NormalizedLabel {
	readonly label: {
		readonly name: Label['name'];
		readonly uid?: Label['uid'];
		readonly parent?: Label['parent'];
		readonly content_types?: Label['content_types'];
	};
}

export function key(o: NormalizedLabel) {
	return o.label.name;
}

export function isNormalizedLabel(
	value: unknown,
): value is NormalizedLabel & Record<string, unknown> {
	if (!isRecord(value)) {
		return false;
	}

	return isLabel(value.label);
}

function isLabel(x: unknown): x is NormalizedLabel['label'] {
	return (
		isRecord(x) &&
		typeof x.name === 'string' &&
		(!('uid' in x) || x.uid === undefined || typeof x.uid === 'string') &&
		(!('parent' in x) ||
			x.parent === undefined ||
			(Array.isArray(x.parent) &&
				x.parent.every((p) => typeof p === 'string'))) &&
		(!('content_types' in x) ||
			x.content_types === undefined ||
			(Array.isArray(x.content_types) &&
				x.content_types.every((ct) => typeof ct === 'string')))
	);
}
