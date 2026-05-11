import type UiContext from '#cli/ui/UiContext.js';
import RateLimitMiddleware from '@arke-systems/cs-rate-limit-middleware';
import type createOpenApiClient from 'openapi-fetch';
import { styleText } from 'util';

export default function attachRateLimiter<
	TClient extends ReturnType<typeof createOpenApiClient>,
>(ui: UiContext, client: TClient) {
	// The middleware handles rate limits automatically with retries and delays
	const rateLimiter = new RateLimitMiddleware();

	rateLimiter.on('rate-limit-exceeded', () => {
		const icon = styleText('redBright', '⚠');
		ui.error(
			icon,
			'Rate limit exceeded after multiple retries.',
			'This may indicate API quota limits or high concurrent usage.',
		);
	});

	if (ui.options.verbose) {
		rateLimiter.on('rate-limit-encountered', () => {
			const icon = styleText('yellowBright', '⚠');
			ui.warn(icon, 'Rate limit encountered. Retrying with backoff...');
		});
	}

	client.use(rateLimiter);

	Object.defineProperty(client, Symbol.asyncDispose, {
		value: rateLimiter[Symbol.asyncDispose].bind(rateLimiter),
	});

	return client as AsyncDisposable & TClient;
}
