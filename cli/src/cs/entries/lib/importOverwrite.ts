import type Client from '#cli/cs/api/Client.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import fileUploadInit from '#cli/cs/api/fileUploadInit.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import { isDeepStrictEqual } from 'node:util';
import type { Entry } from '../Types.js';
import parseImportResponse from './parseImportResponse.js';

export default async function importOverwrite(
	client: Client,
	contentTypeUid: ContentType['uid'],
	entry: Entry,
	locale?: string,
): Promise<Entry> {
	const errorContext = buildContext(contentTypeUid, entry);
	const req = attempt.bind(
		null,
		client,
		contentTypeUid,
		entry,
		locale,
		errorContext,
	);
	return useRetryStrategy(req, errorContext);
}

function buildContext(contentTypeUid: ContentType['uid'], entry: Entry) {
	const y = createStylus('yellowBright');
	const msg1 = y`Failed to update ${contentTypeUid} entry:`;
	const msg2 = y`[${entry.uid}] ${entry.title}.`;
	return `${msg1} ${msg2}`;
}

async function attempt(
	client: Client,
	contentTypeUid: ContentType['uid'],
	entry: Entry,
	locale: string | undefined,
	errorContext: string,
) {
	const response = await client.POST(
		'/v3/content_types/{content_type_uid}/entries/{entry_uid}/import',
		{
			...fileUploadInit,
			body: { entry: JSON.stringify(entry) },

			params: {
				path: {
					content_type_uid: contentTypeUid,
					entry_uid: entry.uid,
				},
				query: {
					...(locale ? { locale } : {}),
					overwrite: 'true',
				},
			},
		},
	);

	return parseImportResponse(response, errorContext);
}

// Attempting to resolve a relatively rare issue where the entry
// fails to update correctly the first time but succeeds on the
// second try. Unclear why this happens.
async function useRetryStrategy(
	req: () => Promise<Entry>,
	errorContext: string,
) {
	try {
		return await req();
	} catch (ex: unknown) {
		if (!isNullReferenceError(ex)) {
			throw ex;
		}

		const ui = getUi();

		try {
			const result = await req();
			ui.warn(errorContext, 'Resolved on second attempt.');
			return result;
		} catch (ex2: unknown) {
			ui.warn(errorContext, 'Failed after second attempt.', [ex, ex2]);
			throw ex2;
		}
	}
}

function isNullReferenceError(ex: unknown) {
	if (!(ex instanceof ContentstackError)) {
		return false;
	}

	const invalidDataCode = 119;
	if (ex.code !== invalidDataCode) {
		return false;
	}

	const nullMsg = "Cannot read properties of null (reading 'data')";

	for (const detail of Object.values(ex.details)) {
		if (!isDeepStrictEqual(detail, [nullMsg])) {
			return false;
		}
	}

	return true;
}
