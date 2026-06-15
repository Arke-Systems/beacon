import type Label from '../../cs/labels/Label.js';
import type NormalizedLabel from './NormalizedLabel.js';

export default function toCs(
	normalized: NormalizedLabel,
	nameToUid?: ReadonlyMap<string, string>,
	uid?: string,
): Label | Omit<Label, 'uid'> {
	const { name, parent, content_types } = normalized.label;

	const transformedParent = transformParentToUids(parent, nameToUid);

	const base = {
		name,
		...(transformedParent && transformedParent.length > 0
			? { parent: transformedParent }
			: {}),
		...(content_types && content_types.length > 0 ? { content_types } : {}),
	};

	return uid ? { ...base, uid } : base;
}

function transformParentToUids(
	parent: readonly string[] | undefined,
	nameToUid: ReadonlyMap<string, string> | undefined,
): readonly string[] | undefined {
	if (!parent || parent.length === 0) {
		return undefined;
	}

	if (!nameToUid) {
		// If no mapping provided, assume parent is already UIDs for backward compatibility
		return parent;
	}

	return parent.map((ref) => {
		// Check if this is a name-based reference (labels/<name>)
		if (ref.startsWith('labels/')) {
			const name = ref.substring('labels/'.length);
			const uid = nameToUid.get(name);
			if (!uid) {
				throw new Error(
					`Cannot resolve parent label name "${name}" to UID. Label may not exist.`,
				);
			}
			return uid;
		}

		// If it's already a UID (backward compatibility), return as-is
		return ref;
	});
}
