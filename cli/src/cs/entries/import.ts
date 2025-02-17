import type Client from '../api/Client.js';
import importCreate from './lib/importCreate.js';
import importOverwrite from './lib/importOverwrite.js';
import type { Entry } from './Types.js';

export default async function importEntry(
	client: Client,
	contentTypeUid: string,
	entry: Entry,
	overwrite: boolean,
) {
	return overwrite
		? await importOverwrite(client, contentTypeUid, entry)
		: await importCreate(client, contentTypeUid, entry);
}
