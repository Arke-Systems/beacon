import type UiContext from '#cli/ui/UiContext.js';
import { AsyncLocalStorage } from 'node:async_hooks';

export const Store = new AsyncLocalStorage<UiContext>();

export default function getUi(): UiContext {
	const ui = Store.getStore();

	if (!ui) {
		throw new Error(`${getUi.name}() must be called within a UI context`);
	}

	return ui;
}
