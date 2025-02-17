import { resolve } from 'node:path';
import getUi from '../lib/SchemaUi.js';

export default function schemaDirectory() {
	const {
		options: {
			schema: { schemaPath },
		},
	} = getUi();

	return resolve(schemaPath, 'content-types');
}
