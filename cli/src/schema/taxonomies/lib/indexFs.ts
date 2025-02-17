import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import {
	isNormalizedTaxonomy,
	key,
} from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import indexFromFilesystem from '#cli/schema/xfer/indexFromFilesystem.js';
import schemaDirectory from '../schemaDirectory.js';

export default async function indexFs(): Promise<
	ReadonlyMap<string, NormalizedTaxonomy>
> {
	return indexFromFilesystem(schemaDirectory(), isNormalizedTaxonomy, key);
}
