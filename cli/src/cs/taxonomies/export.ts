import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import { isTaxonomyDetail } from './TaxonomyDetail.js';

export default async function exportTaxonomy(client: Client, uid: string) {
	const { data, error } = await client.GET(
		'/v3/taxonomies/{taxonomy_uid}/export',
		{
			params: {
				path: { taxonomy_uid: uid },
				query: { format: 'json' },
			},
		},
	);

	const msg = `Failed to export taxonomy: ${uid}`;
	ContentstackError.throwIfError(error, msg);

	const result = data as unknown;

	if (!isTaxonomyDetail(result)) {
		throw new Error(msg);
	}

	// Normalize by removing locale fields that Contentstack adds
	const { locale: _taxonomyLocale, ...taxonomy } = result.taxonomy;
	const terms = result.terms.map(({ locale: _termLocale, ...term }) => term);

	return { taxonomy, terms };
}
