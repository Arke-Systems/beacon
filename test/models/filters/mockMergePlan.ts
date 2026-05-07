import type AssetMeta from '#cli/schema/assets/AssetMeta.js';
import type MergePlan from '#cli/schema/xfer/lib/MergePlan.js';
import type { Theory } from '../../models/filters/Theory.js';

export default function mockMergePlan(
	theory: Theory,
	itemPath: string,
	source: ReadonlyMap<string, AssetMeta>,
	destination: ReadonlyMap<string, AssetMeta>,
): MergePlan<AssetMeta> {
	const expected = {
		toCreate: new Map<string, AssetMeta>(),
		toRemove: new Map<string, AssetMeta>(),
		toSkip: new Map<string, AssetMeta>(),
		toUpdate: new Map<string, AssetMeta>(),
	};

	// Excluded assets should not appear in any result set
	if (!theory.included) {
		return expected;
	}

	const sourceItem = source.get(itemPath);
	const destinationItem = destination.get(itemPath);

	switch (theory.expected) {
		case 'skip':
		case 'warning':
			expected.toSkip.set(itemPath, sourceItem ?? destinationItem!);
			break;

		case 'create':
			expected.toCreate.set(itemPath, sourceItem!);
			break;

		case 'delete':
			expected.toRemove.set(itemPath, destinationItem!);
			break;

		case 'update':
			expected.toUpdate.set(itemPath, sourceItem!);
			break;
	}

	return expected;
}
