import type { ConsoleUiContext } from '#cli/ui/UiContext.js';
import formatAction from './formatAction.js';
import formatCounter from './formatCounter.js';
import formatElapsed from './formatElapsed.js';
import formatName from './formatName.js';
import type Payload from './Payload.js';
import type ProgressBar from './ProgressBar.js';
import type StyledText from './StyledText.js';

export default class VerboseProgressBar implements ProgressBar {
	#current = 0;

	// Justification "999 ms".length
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	#maxElapsedLength = 6;

	public constructor(
		private readonly ui: ConsoleUiContext,
		private readonly name: string,
		private readonly total: number,
	) {}

	increment(step?: number): void {
		this.#current += step ?? 1;
	}

	update(payload: Payload): void {
		const name = padEnd(formatName(this.name), this.ui.maxProgressNameLength);

		const counter = formatCounter(this.ui, {
			total: this.total,
			value: this.#current,
		}).value;

		const elapsed = formatElapsed(payload.elapsedMs);

		this.#maxElapsedLength = Math.max(
			this.#maxElapsedLength,
			elapsed.visibleLength,
		);

		const paddedElapsed =
			elapsed.value.length > 0
				? padStart(elapsed, this.#maxElapsedLength).value
				: '';

		this.ui.info(
			...[
				name.value,
				`(${counter}):`,
				paddedElapsed,
				formatAction(payload).value,
			].filter(Boolean),
		);
	}

	[Symbol.dispose](): void {
		// no-op
	}
}

function padEnd(text: StyledText, length: number): StyledText {
	if (text.visibleLength >= length || !Number.isFinite(length)) {
		return text;
	}

	const paddedValue = text.value + ' '.repeat(length - text.visibleLength);
	return { value: paddedValue, visibleLength: length };
}

function padStart(text: StyledText, length: number): StyledText {
	if (text.visibleLength >= length || !Number.isFinite(length)) {
		return text;
	}

	const paddedValue = ' '.repeat(length - text.visibleLength) + text.value;
	return { value: paddedValue, visibleLength: length };
}
