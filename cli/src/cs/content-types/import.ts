import type Client from '#cli/cs/api/Client.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import fileUploadInit from '#cli/cs/api/fileUploadInit.js';
import createStylus from '#cli/ui/createStylus.js';
import isRecord from '#cli/util/isRecord.js';
import { inspect, isDeepStrictEqual } from 'node:util';
import { isSchema, type Schema } from '../Types.js';

export default async function importContentType(
	client: Client,
	schema: Schema,
	overwrite: boolean,
) {
	const result = await client.POST('/v3/content_types/import', {
		...fileUploadInit,

		body: { content_type: JSON.stringify(schema) },

		params: {
			query: { overwrite: overwrite.toString() },
		},
	});

	const y = createStylus('yellowBright');
	const errorContext = y`Failed to import content type: ${schema.uid}.`;

	ContentstackError.throwIfError(result.error, errorContext);
	throwIfNotOk(result.response, errorContext);
	const imported = selectImported(result, errorContext);
	throwIfNotImportedAccurately(schema, imported, errorContext);
}

function throwIfNotImportedAccurately(
	schema: Schema,
	imported: Schema,
	errorContext: string,
) {
	if (isDeepStrictEqual(schema.schema, imported.schema)) {
		return;
	}

	const msg2 = 'Expected the imported content type to match the schema.';

	const msg3 =
		'Provided to Contentstack: ' +
		inspect(schema.schema, { colors: true, depth: Infinity });

	const msg4 =
		'Imported by Contentstack: ' +
		inspect(imported.schema, { colors: true, depth: Infinity });

	throw new Error(`${errorContext} ${msg2}\n${msg3}\n${msg4}`);
}

function throwIfNotOk(response: Response, errorContext: string) {
	if (!response.ok) {
		const y = createStylus('yellowBright');
		const msg2 = 'Contentstack responded with status';
		const msg3 = y`${response.status.toString()}:`;
		const msg4 = y`${response.statusText}.`;
		throw new Error(`${errorContext} ${msg2} ${msg3} ${msg4}`);
	}
}

function selectImported(result: unknown, errorContext: string) {
	if (!isRecord(result)) {
		const msg2 = 'Expected response to be an object.';
		throw new Error(`${errorContext} ${msg2}`);
	}

	const { data } = result;
	if (!isRecord(data)) {
		const msg2 = 'Expected response data to be an object.';

		const { response, ...rest } = result;
		const msg3 = inspect(rest, { colors: true, depth: Infinity });

		throw new Error(`${errorContext} ${msg2} ${msg3}`);
	}

	const { content_type: imported } = data;
	if (!isSchema(imported)) {
		const msg2 = 'Expected response data to include the imported content type.';
		throw new Error(`${errorContext} ${msg2}`);
	}

	return imported;
}
