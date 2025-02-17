import type { ContentType } from '../../cs/content-types/Types.js';
import type { Entry } from '../../cs/entries/Types.js';
import BeaconReplacer from './BeaconReplacer.js';
import type MinimalCtx from './lib/MinimalCtx.js';

export default function toCs(
	ctx: MinimalCtx,
	contentType: ContentType,
	entry: Entry,
) {
	const replacer = new BeaconReplacer(ctx, contentType);
	return replacer.process(entry);
}
