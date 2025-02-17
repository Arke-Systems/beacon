import ContentstackError from '#cli/cs/api/ContentstackError.js';
import isRecord from '#cli/util/isRecord.js';
import { isEntry } from '../Types.js';

export default function parseImportResponse(
	response: {
		data?: unknown;
		error?: unknown;
		response: Response;
	},
	context: string,
) {
	ContentstackError.throwIfError(response.error, context);

	if (!response.response.ok) {
		throw new Error(context);
	}

	const { data } = response;

	if (!isRecord(data)) {
		throw new TypeError(context);
	}

	const { entry: importedEntry } = data;

	if (!isEntry(importedEntry)) {
		throw new Error(context);
	}

	return importedEntry;
}
