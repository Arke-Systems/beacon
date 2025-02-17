import { resolve } from 'node:path';
import getUi from '../lib/SchemaUi.js';

export default function schemaDirectory(contentTypeUid: string) {
	const {
		options: {
			schema: { schemaPath },
		},
	} = getUi();

	return resolve(schemaPath, 'entries', contentTypeUid);
}
