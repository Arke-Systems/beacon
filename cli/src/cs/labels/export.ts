import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import type Label from './Label.js';
import { isLabel } from './Label.js';

export default async function exportLabel(
	client: Client,
	labelUid: string,
): Promise<Label> {
	const { data, error, response } = await client.GET('/v3/labels/{label_uid}', {
		params: {
			path: { label_uid: labelUid },
		},
	});

	const msg = `Failed to export label: ${labelUid}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}

	const result = data as unknown;

	if (!isValidLabelResponse(result)) {
		throw new Error(msg);
	}

	return result.label;
}

function isValidLabelResponse(
	o: unknown,
): o is Record<string, unknown> & { label: Label } {
	return (
		typeof o === 'object' &&
		o !== null &&
		'label' in o &&
		o.label !== null &&
		isLabel(o.label)
	);
}
