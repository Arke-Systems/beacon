import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Schema, SchemaFields } from '#cli/cs/Types.js';
import isJsonRteField from '#cli/dto/entry/lib/isJsonRteField.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import isRecord from '#cli/util/isRecord.js';
import { styleText } from 'node:util';
import type { Entry } from '../Types.js';

// We are encountering some instances with partially-formed entries. These have
// no data in any field, including the title field, which comes across as an
// empty string. This causes issues when there are two or more of these because
// the empty string is still a valid key value, but we can't deal with
// duplicate keys.
//
// I do not know how these entries come into being and I have not been able to
// replicate the issue. This code is an attempt to filter them out.
export default function isEmptyEntry(
	globalFieldsByUid: ReadonlyMap<Schema['uid'], Schema>,
	contentType: ContentType,
	x: Entry,
): boolean {
	if (x.title) {
		return false;
	}

	const props = new Map(Object.entries(x));
	props.delete('_in_progress');
	props.delete('_version');
	props.delete('ACL');
	props.delete('created_at');
	props.delete('created_by');
	props.delete('locale');
	props.delete('uid');
	props.delete('updated_at');
	props.delete('updated_by');

	const reduced = Object.fromEntries(props);

	if (!hasRealData(reduced)) {
		getUi().warn(
			'Empty',
			styleText('yellowBright', contentType.title),
			'entry detected and filtered out:',
			`[${styleText('yellowBright', x.uid)}]`,
			x.title
				? `(${styleText('yellowBright', x.title)})`
				: `(${styleText('dim', 'Untitled')})`,
		);

		return true;
	}

	return false;
}

function hasRealData(obj: Readonly<Record<string, unknown>>) {
	for (const value of Object.values(obj)) {
		if (typeof value === 'string') {
			if (value !== '') {
				return true;
			}
		}

		if (Array.isArray(value)) {
			if (value.length > 0) {
				return true;
			}
		}

		if (isRecord(value)) {
			if (hasRealData(value)) {
				return true;
			}
		}
	}

	return false;
}
