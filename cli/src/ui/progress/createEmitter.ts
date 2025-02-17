import type { ConsoleUiContext } from '#cli/ui/UiContext.js';
import { inspect } from 'node:util';

export default function createEmitter(
	ui: ConsoleUiContext,
	level: 'error' | 'info' | 'warn',
) {
	return (message: unknown, ...optionalParams: unknown[]) => {
		const container = ui.barContainer;

		if (ui.options.verbose || !container) {
			console[level](message, ...optionalParams);
			return;
		}

		const raw = [message, ...optionalParams]
			.map((o) => (typeof o === 'string' ? o : inspect(o, { colors: true })))
			.join(' ');

		const end = raw.endsWith('\n') ? '' : '\n';

		container.log(`${raw}${end}`);
	};
}
