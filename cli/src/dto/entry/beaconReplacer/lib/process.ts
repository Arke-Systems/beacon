import type { Entry } from '#cli/cs/entries/Types.js';
import type BeaconReplacer from '../../BeaconReplacer.js';

export default function process(this: BeaconReplacer, entry: Entry): Entry {
	this.refPath = `${this.contentType.uid}/${entry.title}`;
	const phase1 = this.stripTaxonomies(entry);
	const phase2 = this.processObject(phase1);
	this.refPath = undefined;
	return phase2 as unknown as Entry;
}
