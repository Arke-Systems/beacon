import type Client from '#cli/cs/api/Client.js';
import exportTaxonomy from '#cli/cs/taxonomies/export.js';
import indexTaxonomies from '#cli/cs/taxonomies/index.js';
import type Taxonomy from '#cli/cs/taxonomies/Taxonomy.js';
import fromCs from '#cli/dto/taxonomy/fromCs.js';
import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import taxonomyStrategy from '#cli/dto/taxonomy/taxonomyStrategy.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';

export default async function indexCs(
	client: Client,
): Promise<ReadonlyMap<string, NormalizedTaxonomy>> {
	const raw = await indexTaxonomies(client);
	const transformed = new Map<string, NormalizedTaxonomy>();
	const toExport = taxonomiesNeedingFullExport(raw);

	for (const taxonomy of raw.values()) {
		if (toExport.has(taxonomy)) {
			continue;
		}

		transformed.set(taxonomy.uid, fromCs(taxonomy));
	}

	for await (const normalized of taxonomiesWithTerms(client, toExport)) {
		transformed.set(normalized.taxonomy.uid, normalized);
	}

	return transformed;
}

async function* taxonomiesWithTerms(
	client: Client,
	toExport: ReadonlySet<Taxonomy>,
) {
	if (toExport.size === 0) {
		return;
	}

	const ui = getUi();
	using bar = ui.createProgressBar('Taxonomy terms', toExport.size);

	for (const taxonomy of toExport) {
		using reporter = new ProgressReporter(
			bar,
			'Loading',
			`${taxonomy.name} terms`,
		);

		const exported = await exportTaxonomy(client, taxonomy.uid);
		yield fromCs(taxonomy, exported.terms);
		bar.increment();
		reporter.finish('Loaded');
	}
}

function taxonomiesNeedingFullExport(
	taxonomies: ReadonlyMap<string, Taxonomy>,
): ReadonlySet<Taxonomy> {
	const result = new Set<Taxonomy>();

	for (const [uid, taxonomy] of taxonomies) {
		const strategy = taxonomyStrategy(uid);

		if (strategy === 'taxonomy and terms') {
			result.add(taxonomy);
		}
	}

	return result;
}
