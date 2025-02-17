import { minimatch } from 'minimatch';
import type Taxonomy from '../../cs/taxonomies/Taxonomy.js';
import getUi from '../../schema/lib/SchemaUi.js';
import type { TaxonomyStrategy } from '../../ui/Options.js';

export default function taxonomyStrategy(
	taxonomyUid: Taxonomy['uid'],
): TaxonomyStrategy {
	const ui = getUi();

	for (const [pattern, strategy] of ui.options.schema.taxonomies) {
		if (minimatch(taxonomyUid, pattern)) {
			return strategy;
		}
	}

	return 'taxonomy and terms';
}
