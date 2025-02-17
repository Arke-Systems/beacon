import type { ConsoleUiContext } from '#cli/ui/UiContext.js';
import type { Params } from 'cli-progress';
import { styleText } from 'node:util';
import type StyledText from './StyledText.js';

export default function formatCounter(
	{ maxTotalLength }: ConsoleUiContext,
	params: Pick<Params, 'total' | 'value'>,
): StyledText {
	const current = params.value.toLocaleString().padStart(maxTotalLength);
	const total = params.total.toLocaleString().padStart(maxTotalLength);
	const sep = ' / ';

	const value = [
		styleText('yellowBright', current),
		styleText('dim', sep),
		styleText('yellowBright', total),
	].join('');

	const visibleLength = current.length + sep.length + total.length;

	return { value, visibleLength };
}
