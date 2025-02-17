import { styleText } from 'node:util';

export default function createStylus(format: Parameters<typeof styleText>[0]) {
	return (strings: readonly string[], ...highlights: readonly string[]) =>
		strings.reduce((acc, str, i) => {
			acc += str;

			const highlight = highlights[i];
			if (typeof highlight === 'string' && highlight.length > 0) {
				acc += styleText(format, highlight);
			}

			return acc;
		}, '');
}
