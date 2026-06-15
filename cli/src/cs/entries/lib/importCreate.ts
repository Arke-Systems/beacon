import type Client from '#cli/cs/api/Client.js';
import fileUploadInit from '#cli/cs/api/fileUploadInit.js';
import type { ContentType } from '#cli/cs/content-types/Types.js';
import createStylus from '#cli/ui/createStylus.js';
import type { Entry } from '../Types.js';
import parseImportResponse from './parseImportResponse.js';

export default async function importCreate(
	client: Client,
	contentTypeUid: ContentType['uid'],
	entry: Entry,
	locale?: string,
): Promise<Entry> {
	const y = createStylus('yellowBright');
	const msg = y`Failed to create ${contentTypeUid} entry: ${entry.title}.`;

	const response = await client.POST(
		'/v3/content_types/{content_type_uid}/entries/import',
		{
			...fileUploadInit,
			body: { entry: JSON.stringify(entry) },

			params: {
				path: { content_type_uid: contentTypeUid },
				query: {
					...(locale ? { locale } : {}),
					overwrite: 'false',
				},
			},
		},
	);

	return parseImportResponse(response, msg);
}
