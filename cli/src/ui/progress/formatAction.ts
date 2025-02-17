import { styleText } from 'node:util';
import type Payload from './Payload.js';
import type StyledText from './StyledText.js';

export default function formatAction(
	{ action, key }: Payload,
	availableWidth = Infinity,
): StyledText {
	if (!(action && key)) {
		return { value: '', visibleLength: 0 };
	}

	const visibleLength = action.length + key.length + 1;
	if (availableWidth < visibleLength) {
		return { value: '', visibleLength: 0 };
	}

	const value = `${styleText('cyanBright', action)} ${styleText('cyan', key)}`;
	return { value, visibleLength };
}
