import { styleText } from 'node:util';
import type StyledText from './StyledText.js';

export default function formatName(
	name: string,
	availableWidth = Infinity,
): StyledText {
	const visibleLength = name.length;
	if (availableWidth < visibleLength) {
		return { value: '', visibleLength: 0 };
	}

	return { value: styleText('yellowBright', name), visibleLength };
}
