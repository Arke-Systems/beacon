import isRecord from '#cli/util/isRecord.js';
import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import type { RawFolder } from './Types.js';
import { isRawFolder } from './Types.js';

export default async function createFolder(
	client: Client,
	name: string,
	parentUid?: string | null,
): Promise<RawFolder> {
	const response = await client.POST('/v3/assets/folders', {
		body: {
			asset: {
				...(typeof parentUid === 'string' ? { parent_uid: parentUid } : {}),
				name,
			},
		},
	});

	ContentstackError.throwIfError(
		response.error,
		'Failed to create asset folder: ' + name,
	);

	const result = response.data as unknown;

	if (!isRecord(result) || !result.asset) {
		throw new Error('Invalid response from Contentstack');
	}

	const { asset: folder } = result;

	if (!isRawFolder(folder)) {
		throw new Error('Invalid response from Contentstack');
	}

	return folder;
}
