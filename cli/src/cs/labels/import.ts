import type Client from '../api/Client.js';
import ContentstackError from '../api/ContentstackError.js';
import type Label from './Label.js';

export default async function importLabel(
	client: Client,
	label: Omit<Label, 'uid'>,
): Promise<Label['uid']> {
	const { data, error, response } = await client.POST('/v3/labels', {
		body: { label },
	});

	const labelName = String(label.name);
	const msg = `Failed to import label: ${labelName}`;
	ContentstackError.throwIfError(error, msg);

	if (!response.ok) {
		throw new Error(msg);
	}

	const result = data as unknown;
	const uid =
		result &&
		typeof result === 'object' &&
		'label' in result &&
		result.label &&
		typeof result.label === 'object' &&
		'uid' in result.label
			? result.label.uid
			: undefined;

	if (typeof uid !== 'string') {
		throw new Error(msg);
	}

	return uid;
}
