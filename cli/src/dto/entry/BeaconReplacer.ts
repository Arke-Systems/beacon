import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { ReferencePath } from '#cli/cs/entries/Types.js';
import mapItemPathToAsset from './beaconReplacer/lib/mapItemPathToAsset.js';
import process from './beaconReplacer/lib/process.js';
import processAsset from './beaconReplacer/lib/processAsset.js';
import processJsonRteAsset from './beaconReplacer/lib/processJsonRteAsset.js';
import processObject from './beaconReplacer/lib/processObject.js';
import processReference from './beaconReplacer/lib/processReference.js';
import processValue from './beaconReplacer/lib/processValue.js';
import stripTaxonomies from './beaconReplacer/lib/stripTaxonomies.js';
import type MinimalCtx from './lib/MinimalCtx.js';

export default class BeaconReplacer {
	public readonly process: typeof process;
	protected refPath: ReferencePath | undefined;
	protected readonly mapItemPathToAsset: typeof mapItemPathToAsset;
	protected readonly processAsset: typeof processAsset;
	protected readonly processJsonRteAsset: typeof processJsonRteAsset;
	protected readonly processObject: typeof processObject;
	protected readonly processReference: typeof processReference;
	protected readonly processValue: typeof processValue;
	protected readonly stripTaxonomies: typeof stripTaxonomies;

	public constructor(
		protected readonly ctx: MinimalCtx,
		protected readonly contentType: ContentType,
	) {
		this.mapItemPathToAsset = mapItemPathToAsset.bind(this);
		this.process = process.bind(this);
		this.processAsset = processAsset.bind(this);
		this.processJsonRteAsset = processJsonRteAsset.bind(this);
		this.processObject = processObject.bind(this);
		this.processReference = processReference.bind(this);
		this.processValue = processValue.bind(this);
		this.stripTaxonomies = stripTaxonomies.bind(this);
	}
}
