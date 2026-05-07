import type Client from '#cli/cs/api/Client.js';
import type { RawAsset, RawFolder } from '#cli/cs/assets/Types.js';
import { isRawAsset } from '#cli/cs/assets/Types.js';
import deleteAsset from '#cli/cs/assets/delete.js';
import deleteFolder from '#cli/cs/assets/deleteFolder.js';
import indexAssets from '#cli/cs/assets/index.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import deleteContentType from '#cli/cs/content-types/delete.js';
import indexContentTypes from '#cli/cs/content-types/index.js';
import deleteEntry from '#cli/cs/entries/delete.js';
import indexEntriesForLocale from '#cli/cs/entries/indexEntriesForLocale.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import deleteGlobalField from '#cli/cs/global-fields/delete.js';
import indexGlobalFields from '#cli/cs/global-fields/index.js';
import { getLocales } from '#cli/cs/locales/getLocales.js';
import deleteTaxonomy from '#cli/cs/taxonomies/delete.js';
import indexTaxonomies from '#cli/cs/taxonomies/index.js';
import type { Schema } from '#cli/cs/Types.js';
import type UiContext from '#cli/ui/UiContext.js';
import ProgressReporter from '../ui/progress/ProgressReporter.js';
import resolveItemPath from './assets/lib/resolveItemPath.js';

export default async function clear(
	client: Client,
	ui: UiContext,
	deleteAssets = false,
	contentTypes: string[] = [],
) {
	// If specific content types are provided, delete entries and the content types themselves
	if (contentTypes.length > 0) {
		await deleteEntriesAndContentTypes(client, ui, contentTypes);
		return;
	}

	// Otherwise, delete everything (original behavior)
	await Promise.allSettled([
		deleteAllContentTypes(client, ui),
		deleteAllGlobalFields(client, ui),
		deleteAllTaxonomies(client, ui),
		deleteAllAssets(client, ui, deleteAssets),
	]);
}

async function deleteEntriesAndContentTypes(
	client: Client,
	ui: UiContext,
	contentTypeUids: string[],
) {
	// Get all content types to find the ones we need
	const allContentTypes = await indexContentTypes(client);
	const globalFields = await indexGlobalFields(client);

	// Debug: Log all available content types
	ui.info('\nAvailable content types:');
	for (const [uid, ct] of allContentTypes) {
		ui.info(`  - ${uid} (${ct.title})`);
	}
	ui.info(`\nRequested content types: ${contentTypeUids.join(', ')}\n`);

	// Filter to only the requested content types
	const contentTypesToClear = contentTypeUids
		.map((uid) => {
			const ct = allContentTypes.get(uid);
			if (!ct) {
				ui.warn(`Content type UID not found: ${uid}`);
			}
			return ct;
		})
		.filter((ct) => ct !== undefined);

	if (contentTypesToClear.length === 0) {
		ui.warn('No matching content types found for the specified UIDs.');
		return;
	}

	// Get all locales to ensure we fetch entries from all locale versions
	const locales = await getLocales(client);

	// Delete entries for each content type
	for (const contentType of contentTypesToClear) {
		await deleteEntriesForContentType(
			client,
			ui,
			contentType,
			globalFields,
			locales,
		);
	}

	// Now delete the content types themselves
	ui.info('\nDeleting content types...\n');
	await deleteAll(
		ui,
		'Content Types',
		(item) => item.title,
		() => new Map(contentTypesToClear.map((ct) => [ct.uid, ct])),
		async (item) => deleteContentType(client, item.uid),
	);
}

async function deleteEntriesForContentType(
	client: Client,
	ui: UiContext,
	contentType: ContentType,
	globalFields: ReadonlyMap<Schema['uid'], Schema>,
	locales: readonly { code: string }[],
) {
	const orphanedEntries: { uid: string; title: string }[] = [];

	// Fetch entries first to log count
	const entries = await indexEntriesForAllLocales(
		client,
		globalFields,
		contentType,
		locales,
	);

	ui.info(
		`\nFound ${entries.size} entries for content type: ${contentType.title} (${contentType.uid})`,
	);

	if (entries.size === 0) {
		ui.info('No entries to delete.\n');
		return;
	}

	await deleteAll(
		ui,
		`${contentType.title} Entries`,
		(entry) => entry.title,
		() => entries,
		async (entry) => {
			// When deleting all localized versions, don't pass a locale parameter
			// The delete_all_localized=true flag handles all locales automatically
			// Passing a locale parameter with delete_all_localized causes API errors
			// for non-localized entries
			const result = await deleteEntry(
				client,
				contentType.uid,
				entry.uid,
				true, // deleteAllLocalized
			);

			if (result.notFound) {
				// Entry appeared in listing but can't be deleted
				orphanedEntries.push({ title: entry.title, uid: entry.uid });
			}
		},
	);

	reportOrphanedEntries(ui, contentType.title, orphanedEntries);
}

function reportOrphanedEntries(
	ui: UiContext,
	contentTypeName: string,
	orphanedEntries: { uid: string; title: string }[],
) {
	if (orphanedEntries.length === 0) {
		return;
	}

	const maxOrphanedToDisplay = 5;

	ui.warn(
		`Warning: Found ${orphanedEntries.length} orphaned/corrupted ${contentTypeName} entries that could not be deleted:`,
	);
	for (const entry of orphanedEntries.slice(0, maxOrphanedToDisplay)) {
		ui.warn(`  - "${entry.title}" (${entry.uid})`);
	}
	if (orphanedEntries.length > maxOrphanedToDisplay) {
		ui.warn(`  ... and ${orphanedEntries.length - maxOrphanedToDisplay} more`);
	}
	ui.warn(
		'These entries appear in the listing API but return "not found" when attempting to delete.',
	);
	ui.warn(
		'You may need to contact Contentstack support to clean up these orphaned entries.',
	);
}

async function indexEntriesForAllLocales(
	client: Client,
	globalFields: ReadonlyMap<Schema['uid'], Schema>,
	contentType: ContentType,
	locales: readonly { code: string }[],
): Promise<ReadonlyMap<string, Entry & { _fetchedFromLocale: string }>> {
	// Fetch entries from all locales, tracking which locale each was fetched from
	const entriesWithLocale = await Promise.all(
		locales.map(async (locale) => {
			const entries = await indexEntriesForLocale(
				client,
				globalFields,
				contentType,
				locale.code,
			);
			// Tag each entry with the locale it was fetched from
			return { entries, locale: locale.code };
		}),
	);

	// Merge all entries, deduplicating by UID
	// Since the same entry can exist in multiple locales with the same UID,
	// we only need to keep one instance per UID for deletion purposes
	// We preserve the locale it was fetched from so we can use it for deletion
	const uniqueEntries = new Map<
		string,
		Entry & { _fetchedFromLocale: string }
	>();
	for (const { locale, entries } of entriesWithLocale) {
		for (const [uid, entry] of entries) {
			if (!uniqueEntries.has(uid)) {
				uniqueEntries.set(uid, { ...entry, _fetchedFromLocale: locale });
			}
		}
	}

	return uniqueEntries;
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
			bar.increment();
			reporter.finish('deleted');
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

async function deleteAllAssets(
	client: Client,
	ui: UiContext,
	deleteAssets: boolean,
) {
	const assets = await indexAssets(client);
	const { isIncluded } = ui.options.schema.assets;
	const folders = new Map<string, RawFolder>();
	const files = new Map<string, RawAsset>();

	for (const asset of assets.values()) {
		// Check if the asset is included by the filters (unless deleteAssets flag is set)
		if (!deleteAssets) {
			const itemPath = resolveItemPath(assets, asset);
			if (!isIncluded(itemPath)) {
				continue;
			}

			// When filtering by included assets, skip nested ones as they'll be deleted with parent
			if (asset.parent_uid) {
				continue;
			}
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
