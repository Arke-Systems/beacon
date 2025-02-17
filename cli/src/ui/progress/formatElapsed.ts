import { styleText } from 'node:util';
import type StyledText from './StyledText.js';

const formater = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 0,
	minimumFractionDigits: 0,
	style: 'unit',
	unit: 'millisecond',
	unitDisplay: 'short',
});

export default function formatElapsed(ms: number | undefined): StyledText {
	if (typeof ms !== 'number') {
		return { value: '', visibleLength: 0 };
	}

	const human = formater.format(ms);
	const value = styleText('dim', human);
	return { value, visibleLength: human.length };
}
