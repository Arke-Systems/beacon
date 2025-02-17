import type AssetMeta from '#cli/schema/assets/AssetMeta.js';

type Expectation = 'create' | 'delete' | 'skip' | 'update' | 'warning';

export class Theory {
	public constructor(
		public readonly cs: boolean,
		public readonly fs: boolean,
		public readonly included: boolean,
		public readonly identical: boolean,
		public readonly expected: Expectation,
	) {}
}

export function arrange(theory: Theory) {
	const cs = new Map<string, AssetMeta>();
	const fs = new Map<string, AssetMeta>();
	const itemPath = 'some_asset_file.webp';

	if (theory.cs) {
		const csMeta = {
			...mockPartialAsset(itemPath),
			title: theory.identical ? 'Identical Asset File' : 'Asset in CS',
		};

		cs.set(itemPath, csMeta);

		if (theory.fs) {
			const fsMeta = theory.identical
				? { ...csMeta }
				: { ...csMeta, title: 'Asset in FS' };

			fs.set(itemPath, fsMeta);
		}
	} else if (theory.fs) {
		const fsMeta = { ...mockPartialAsset(itemPath), title: 'Asset in FS' };
		fs.set(itemPath, fsMeta);
	}

	const isIncluded = () => theory.included;
	return { cs, fs, isIncluded, itemPath };
}

function mockPartialAsset(itemPath: string) {
	return {
		fileSize: 123,
		itemPath,
		tags: new Set(['tag1']),
	};
}
