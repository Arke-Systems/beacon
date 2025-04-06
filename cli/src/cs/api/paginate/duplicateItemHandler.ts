import getUi from '#cli/schema/lib/SchemaUi.js';
import HandledError from '#cli/ui/HandledError.js';
import { inspect, isDeepStrictEqual, styleText } from 'node:util';

export default function duplicateItemHandler(
	pluralNoun: string,
	acc: ReadonlyMap<string, unknown>,
	key: string,
	item: unknown,
) {
	const existing = acc.get(key);

	if (existing === undefined) {
		return;
	}

	const msgs = ['Encountered a duplicate item while indexing '];
	msgs.push(styleText('bold', pluralNoun));
	msgs.push(' by key: ');

	if (key === '') {
		msgs.push(styleText('dim', '[empty string]'));
	} else {
		msgs.push(styleText('bold', key));
	}

	msgs.push('.');

	if (isDeepStrictEqual(existing, item)) {
		getUi().warn(msgs.join(''));
		return;
	}

	msgs.push('\nThis is fatal because the items are not equal!\n');
	msgs.push(styleText('bold', 'First'));
	msgs.push(': ');
	msgs.push(inspect(existing, { colors: true, depth: Infinity }));

	msgs.push('\n');
	msgs.push(styleText('bold', 'Second'));
	msgs.push(': ');
	msgs.push(inspect(item, { colors: true, depth: Infinity }));

	const msg = msgs.join('');

	throw new HandledError(msg);
}
