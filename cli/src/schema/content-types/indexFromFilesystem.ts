import type { ContentType } from '#cli/cs/content-types/Types.js';
import { isSchema, itemKey } from '#cli/cs/Types.js';
import type Filename from '../xfer/Filename.js';
import baseIndexFromFilesystem from '../xfer/indexFromFilesystem.js';
import schemaDirectory from './schemaDirectory.js';

export default async function indexFromFilesystem(): Promise<
	ReadonlyMap<ContentType['uid'], ContentType & { [Filename]: string }>
> {
	return baseIndexFromFilesystem(schemaDirectory(), isSchema, itemKey);
}
