import type Client from '#cli/cs/api/Client.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import importEntry from '#cli/cs/entries/import.js';
import indexEntries from '#cli/cs/entries/index.js';
import type BeaconReplacer from '#cli/dto/entry/BeaconReplacer.js';
import type Ctx from '#cli/schema/ctx/Ctx.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import { isDeepStrictEqual } from 'node:util';

export default function buildCreator(
	ctx: Ctx,
	transformer: BeaconReplacer,
	contentType: ContentType,
) {
	return async (entry: Entry) => {
		const transformed = transformer.process(entry);
		let created: Entry;

		try {
			created = await importEntry(
				ctx.cs.client,
				contentType.uid,
				transformed,
				false,
			);
		} catch (ex) {
			if (isDuplicateKeyError(ex)) {
				const uid = await getUidByTitle(
					ctx.cs.client,
					contentType.uid,
					transformed.title,
				);

				if (!uid) {
					logInvalidState(contentType.title, transformed.title);
					return;
				}

				created = await importEntry(
					ctx.cs.client,
					contentType.uid,
					{ ...transformed, uid },
					true,
				);
			}

			throw ex;
		}

		ctx.references.recordEntryForReferences(contentType.uid, {
			...entry,
			uid: created.uid,
		});
	};
}

function isDuplicateKeyError(ex: unknown) {
	if (!(ex instanceof ContentstackError)) {
		return false;
	}

	const invalidDataCode = 119;
	if (ex.code !== invalidDataCode) {
		return false;
	}

	return isDeepStrictEqual(ex.details, { title: ['is not unique.'] });
}

async function getUidByTitle(
	client: Client,
	contentTypeUid: ContentType['uid'],
	title: string,
) {
	const entries = await indexEntries(client, contentTypeUid);
	return entries.get(title)?.uid;
}

function logInvalidState(contentTypeTitle: string, entryTitle: string) {
	const y = createStylus('yellowBright');
	const ui = getUi();
	const msg1 = y`While importing ${contentTypeTitle} entry ${entryTitle},`;
	const msg2 = 'Contentstack reported a duplicate key error based on the';
	const msg3 = 'title, but no entry with that title was found after';
	const msg4 = 're-indexing.';
	const msg = [msg1, msg2, msg3, msg4].join(' ');
	ui.warn(msg);
}
