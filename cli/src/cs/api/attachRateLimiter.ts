import type UiContext from '#cli/ui/UiContext.js';
import RateLimitMiddleware from '@arke-systems/cs-rate-limit-middleware';
import type createOpenApiClient from 'openapi-fetch';
import { styleText } from 'util';

export default function attachRateLimiter<
	TClient extends ReturnType<typeof createOpenApiClient>,
>(ui: UiContext, client: TClient) {
	const rateLimiter = new RateLimitMiddleware();

	rateLimiter.on('rate-limit-exceeded', () => {
		const icon = styleText('redBright', '⚠');
		ui.error(icon, 'Rate limit exceeded. Giving up.');
	});

	if (ui.options.verbose) {
		rateLimiter.on('rate-limit-encountered', () => {
			const icon = styleText('yellowBright', '⚠');
			ui.warn(icon, 'Rate limit encountered. Waiting...');
		});
	}

	client.use(rateLimiter);

	Object.defineProperty(client, Symbol.asyncDispose, {
		value: rateLimiter[Symbol.asyncDispose].bind(rateLimiter),
	});

	return client as AsyncDisposable & TClient;
}
