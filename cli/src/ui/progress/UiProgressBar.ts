import type { MultiBar, SingleBar } from 'cli-progress';
import type Payload from './Payload.js';
import type ProgressBar from './ProgressBar.js';

export default class UiProgressBar implements ProgressBar {
	readonly #bar: SingleBar;

	public constructor(
		private readonly name: string,
		container: MultiBar,
		total: number,
	) {
		this.#bar = container.create(total, 0, { name });
	}

	increment(step?: number): void {
		this.#bar.increment(step);
	}

	update(payload: Payload): void {
		this.#bar.update(payload);
	}

	[Symbol.dispose](): void {
		this.#bar.update({
			action: undefined,
			elapsedMs: undefined,
			key: undefined,
			name: this.name,
		});

		this.#bar.render();
		this.#bar.stop();
	}
}
