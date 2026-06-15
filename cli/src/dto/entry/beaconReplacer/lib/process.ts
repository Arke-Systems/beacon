import type { Entry } from '#cli/cs/entries/Types.js';
import type BeaconReplacer from '../../BeaconReplacer.js';

export default function process(
	this: BeaconReplacer,
	entry: Entry,
	locale?: string,
): Entry {
	this.refPath = `${this.contentType.uid}/${entry.title}`;
	this.locale = locale;
	const phase1 = this.stripTaxonomies(entry);
	const phase2 = this.processObject(phase1);
	this.refPath = undefined;
	this.locale = undefined;
	return phase2 as unknown as Entry;
}
