import type NormalizedLabel from '#cli/dto/label/NormalizedLabel.js';
import { isNormalizedLabel, key } from '#cli/dto/label/NormalizedLabel.js';
import indexFromFilesystem from '#cli/schema/xfer/indexFromFilesystem.js';
import schemaDirectory from '../schemaDirectory.js';

export default async function indexFs(): Promise<
	ReadonlyMap<string, NormalizedLabel>
> {
	return indexFromFilesystem(schemaDirectory(), isNormalizedLabel, key);
}
