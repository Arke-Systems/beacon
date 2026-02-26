import type Client from '#cli/cs/api/Client.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import assetFolders from './assetFolders/toContentstack.js';
import assets from './assets/toContentstack.js';
import contentTypeShims from './content-types/shimsToContentstack.js';
import contentTypes from './content-types/toContentstack.js';
import Ctx from './ctx/Ctx.js';
import entries from './entries/toContentstack.js';
import updateMissedReferences from './entries/updateMissedReferences.js';
import globalFields from './global-fields/toContentstack.js';
import PushResults from './lib/PushResults.js';
import getUi from './lib/SchemaUi.js';
import taxonomies from './taxonomies/toContentstack.js';
import terms from './terms/toContentstack.js';

export default async function push(client: Client) {
	const results = new PushResults();
	const ctx = await Ctx.prepare(client);

	// When pulling, we can pull all schema / entries at the same time. When
	// pushing, we have to do them in order. The order is defined here:
	//
	// https://www.contentstack.com
	//   /docs/developers/cli/import-content-using-the-cli#module-wise-import
	//
	//     locales > environments > assets > taxonomies > extensions >
	//     marketplace-apps > webhooks > global-fields > content-types >
	//     workflows > entries > labels > custom-roles
	//
	// 2024-10-08 - Update: The above advise appears to be incorrect. Global
	// fields which reference content types may not be created until the
	// referenced content types exist. The current solution is to break the
	// "content type" portion into two parts: one for a series of shims, then
	// the actual content types. The new order becomes:
	//
	//   content-type-shims > global-fields > content-types
	//
	// 2024-10-25 - Update: If we do asset folders first, before assets, we can
	// simplify the logic for assets. We also benefit from the fact that deletion
	// of asset folders implies deletion of all assets within them, saving us the
	// trouble of deleting assets individually.
	await results.set('Asset Folders', assetFolders(ctx));
	await results.set('Assets', assets(ctx));
	await results.set('Taxonomies', taxonomies(ctx));

	for await (const [human, result] of terms(ctx)) {
		await results.set(human, Promise.resolve(result));
	}

	await results.set('Content Type Shims', contentTypeShims(ctx));
	await results.set('Global Fields', globalFields(ctx));
	await results.set('Content Types', contentTypes(ctx));

	const ui = getUi();
	const { isIncluded } = ui.options.schema.entries;
	const contentTypesToSync = [...ctx.fs.contentTypes.values()].filter((ct) =>
		isIncluded(ct.uid),
	);
	const totalEntries = calculateTotalEntries(ctx, contentTypesToSync);

	if (totalEntries > 0) {
		using bar = ui.createProgressBar('Entries', totalEntries);

		for (const contentType of contentTypesToSync) {
			const task = entries(ctx, contentType, bar);
			await results.set(`${contentType.title} entries`, task);
		}
	}

	await results.set('References', updateMissedReferences(ctx));
	return results.value;
}

function calculateTotalEntries(ctx: Ctx, contentTypeList: ContentType[]) {
	return contentTypeList.reduce((acc, ct) => {
		const titles = new Set([
			...ctx.cs.entries.byTitleFor(ct.uid).keys(),
			...ctx.fs.entries.byTitleFor(ct.uid).keys(),
		]);

		return acc + titles.size;
	}, 0);
}
