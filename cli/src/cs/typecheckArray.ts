import createStylus from '#cli/ui/createStylus.js';
import HandledError from '#cli/ui/HandledError.js';

export default function typecheckArray<T>(
	guardFn: (o: unknown) => o is T,
	pluralNoun: string,
	o: unknown,
): o is readonly T[] {
	const y = createStylus('yellowBright');

	if (!Array.isArray(o)) {
		const t = typeof o;
		const letter = t[0]?.toLowerCase() ?? '';
		const article = 'aeiou'.includes(letter) ? 'an' : 'a';
		const msg1 = y`Queried Contentstack for a list of ${pluralNoun} and `;
		const msg2 = y`expected an ${'array'} response. Received `;
		const msg3 = article + y` ${t} instead.`;
		throw new HandledError(`${msg1}${msg2}${msg3}`);
	}

	for (let idx = 0; idx < o.length; idx++) {
		if (!guardFn(o[idx])) {
			const msg1 = y`Queried Contentstack for a list of ${pluralNoun} and `;
			const msg2 = y`received an unexpected ${typeof o[idx]} `;
			const msg3 = y`at index ${idx.toLocaleString()}.`;
			throw new HandledError(`${msg1}${msg2}${msg3}`);
		}
	}

	return true;
}
