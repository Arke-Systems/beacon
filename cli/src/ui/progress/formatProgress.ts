import type { ConsoleUiContext } from '#cli/ui/UiContext.js';
import type { GenericFormatter, Params } from 'cli-progress';
import { styleText } from 'node:util';
import formatAction from './formatAction.js';
import formatCounter from './formatCounter.js';
import formatName from './formatName.js';
import type Payload from './Payload.js';
import { isPayload } from './Payload.js';
import type StyledText from './StyledText.js';

export default function formatProgress(
	ui: ConsoleUiContext,
	...args: Parameters<GenericFormatter>
) {
	const [, params] = args;
	const payload = args[2] as unknown;

	if (!isPayload(payload)) {
		throw new TypeError('Invalid payload');
	}

	return [...components(ui, params, payload)].filter(Boolean).join(' ');
}

function* components(ui: ConsoleUiContext, params: Params, payload: Payload) {
	let remaining = process.stdout.columns || Infinity;

	const counter = formatCounter(ui, params);
	yield counter.value;
	remaining -= counter.visibleLength + 1;

	const bar = formatBar(params, remaining);
	if (bar.value) {
		yield bar.value;
		remaining -= bar.visibleLength + 1;
	}

	const name = formatName(payload.name, remaining);
	if (name.value) {
		yield name.value;
		remaining -= name.visibleLength + 1;
	}

	yield formatAction(payload, remaining).value;
}

function formatBar(params: Params, availableWidth: number): StyledText {
	const openGlyph = '[';
	const closeGlyph = ']';
	const barWidth = 40;
	const visibleLength = openGlyph.length + barWidth + closeGlyph.length;

	if (availableWidth < visibleLength) {
		return { value: '', visibleLength: 0 };
	}

	const completeWidth = Math.round(params.progress * barWidth);
	const remainingWidth = barWidth - completeWidth;

	const open = styleText('dim', openGlyph);
	const complete = styleText('greenBright', '█'.repeat(completeWidth));
	const remaining = styleText('green', '░'.repeat(remainingWidth));
	const close = styleText('dim', closeGlyph);
	const value = `${open}${complete}${remaining}${close}`;

	return { value, visibleLength };
}
