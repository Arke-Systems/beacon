import type Client from '#cli/cs/api/Client.js';
import type { RawAsset, RawFolder } from '#cli/cs/assets/Types.js';
import { isRawAsset } from '#cli/cs/assets/Types.js';
import deleteAsset from '#cli/cs/assets/delete.js';
import deleteFolder from '#cli/cs/assets/deleteFolder.js';
import indexAssets from '#cli/cs/assets/index.js';
import deleteContentType from '#cli/cs/content-types/delete.js';
import indexContentTypes from '#cli/cs/content-types/index.js';
import deleteGlobalField from '#cli/cs/global-fields/delete.js';
import indexGlobalFields from '#cli/cs/global-fields/index.js';
import deleteTaxonomy from '#cli/cs/taxonomies/delete.js';
import indexTaxonomies from '#cli/cs/taxonomies/index.js';
import type UiContext from '#cli/ui/UiContext.js';
import ProgressReporter from '../ui/progress/ProgressReporter.js';

export default async function clear(client: Client, ui: UiContext) {
	await Promise.allSettled([
		deleteAllContentTypes(client, ui),
		deleteAllGlobalFields(client, ui),
		deleteAllTaxonomies(client, ui),
		deleteAllAssets(client, ui),
	]);
}

async function deleteAll<T>(
	ui: UiContext,
	pluralNoun: string,
	humanize: (item: T) => string,
	indexItems: () => Promise<ReadonlyMap<string, T>> | ReadonlyMap<string, T>,
	deleteItem: (item: T) => Promise<void>,
) {
	const items = await indexItems();

	if (!items.size) {
		return;
	}

	{
		using bar = ui.createProgressBar(pluralNoun, items.size);
		for (const item of items.values()) {
			using reporter = new ProgressReporter(bar, 'deleting', humanize(item));
			await deleteItem(item);
			reporter.finish('deleted');
			bar.increment();
		}
	}
}

async function deleteAllContentTypes(client: Client, ui: UiContext) {
	return deleteAll(
		ui,
		'Content Types',
		(item) => item.title,
		async () => indexContentTypes(client),
		async (item) => deleteContentType(client, item.uid),
	);
}

async function deleteAllGlobalFields(client: Client, ui: UiContext) {
	return deleteAll(
		ui,
		'Global Fields',
		(item) => item.title,
		async () => indexGlobalFields(client),
		async (item) => deleteGlobalField(client, item.uid),
	);
}

async function deleteAllTaxonomies(client: Client, ui: UiContext) {
	return deleteAll(
		ui,
		'Taxonomies',
		(item) => item.name,
		async () => indexTaxonomies(client),
		async (item) => deleteTaxonomy(client, item.uid),
	);
}

async function deleteAllAssets(client: Client, ui: UiContext) {
	const assets = await indexAssets(client);
	const folders = new Map<string, RawFolder>();
	const files = new Map<string, RawAsset>();

	for (const asset of assets.values()) {
		// Nested assets get deleted when parents are deleted, so we only need to
		// delete top-level assets
		if (asset.parent_uid) {
			continue;
		}

		if (isRawAsset(asset)) {
			files.set(asset.uid, asset);
		} else {
			folders.set(asset.uid, asset);
		}
	}

	await Promise.all([
		deleteAll(
			ui,
			'Asset Folders',
			(item) => item.name,
			() => folders,
			async (item) => deleteFolder(client, item.uid),
		),
		deleteAll(
			ui,
			'Assets',
			(item) => item.title,
			() => files,
			async (item) => deleteAsset(client, item.uid),
		),
	]);
}
