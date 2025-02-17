import { InvalidArgumentError } from 'commander';

const formatMsg = 'Extension must be in the form of name:uid';

interface ExtensionMaps {
	readonly byName: Map<string, string>;
	readonly byUid: Map<string, string>;
}

// When specified from the command line, such as:
//
//   beacon --extension a:b c:d
//
// Each value is passed in one-at-a-time, so `value` is first `a:b`, then
// argParser is called a second time with `c:d`.
//
// When passed as an environment variable, such as:
//
//   Beacon_Extension=a:b c:d
//
// The entire value is passed at once, so `value` is `a:b c:d`.
export default function mapParser(
	value: string,
	previous?: ExtensionMaps,
): ExtensionMaps {
	const byName = previous?.byName ?? new Map<string, string>();
	const byUid = previous?.byUid ?? new Map<string, string>();

	for (const part of value.split(' ')) {
		const opts = part.split(':');

		const expectedLength = ['name', 'value'].length;
		if (opts.length !== expectedLength) {
			throw new InvalidArgumentError(formatMsg);
		}

		const [name, uid] = opts;
		if (typeof name !== 'string' || typeof uid !== 'string') {
			throw new InvalidArgumentError(formatMsg);
		}

		byName.set(name, uid);
		byUid.set(uid, name);
	}

	return { byName, byUid };
}
