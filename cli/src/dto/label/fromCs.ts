import type Label from '../../cs/labels/Label.js';
import type NormalizedLabel from './NormalizedLabel.js';

// Justification: The keys of these objects are ordered carefully to produce
// a readable and stable serialization.

export default function fromCs(
	label: Label,
	uidToName?: ReadonlyMap<string, string>,
): NormalizedLabel {
	return { label: transformLabel(label, uidToName) };
}

function transformLabel(
	{ name, parent, content_types }: Label,
	uidToName?: ReadonlyMap<string, string>,
): NormalizedLabel['label'] {
	const transformedParent = transformParentToNames(parent, uidToName);

	return {
		name,
		...(transformedParent && transformedParent.length > 0
			? { parent: transformedParent }
			: {}),
		...(content_types && content_types.length > 0 ? { content_types } : {}),
	};
}

function transformParentToNames(
	parent: readonly string[] | undefined,
	uidToName: ReadonlyMap<string, string> | undefined,
): readonly string[] | undefined {
	if (!parent || parent.length === 0) {
		return undefined;
	}

	if (!uidToName) {
		// If no mapping provided, keep UIDs as-is for backward compatibility
		return parent;
	}

	return parent.map((uid) => {
		const name = uidToName.get(uid);
		if (!name) {
			throw new Error(
				`Cannot resolve parent label UID ${uid} to name. Label may not exist.`,
			);
		}
		return `labels/${name}`;
	});
}
