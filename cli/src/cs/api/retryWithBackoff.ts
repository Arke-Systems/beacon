/**
 * Retry a function with exponential backoff for rate limit errors (429).
 * This provides an additional layer of retry logic on top of the rate limiter middleware.
 */

export interface RetryOptions {
	/** Maximum number of retry attempts (default: 5) */
	readonly maxAttempts?: number;
	/** Initial delay in milliseconds (default: 1000) */
	readonly initialDelay?: number;
	/** Maximum delay in milliseconds (default: 32000) */
	readonly maxDelay?: number;
	/** Factor to multiply delay by after each attempt (default: 2) */
	readonly backoffFactor?: number;
	/** Whether to add random jitter to delays (default: true) */
	readonly jitter?: boolean;
}

export interface RateLimitError {
	readonly error_code?: number;
	readonly error_message?: string;
}

const defaultOptions: Required<RetryOptions> = {
	backoffFactor: 2,
	initialDelay: 1000,
	jitter: true,
	maxAttempts: 5,
	maxDelay: 32000,
};

const HTTP_TOO_MANY_REQUESTS = 429;
const JITTER_FACTOR = 0.25; // ±25%
const JITTER_MULTIPLIER = 2;

/**
 * Check if an error object indicates a rate limit error (429).
 */
function isRateLimitError(error: unknown): error is RateLimitError {
	return (
		typeof error === 'object' &&
		error !== null &&
		'error_code' in error &&
		error.error_code === HTTP_TOO_MANY_REQUESTS
	);
}

/**
 * Calculate delay with exponential backoff and optional jitter.
 */
function calculateDelay(
	attempt: number,
	initialDelay: number,
	backoffFactor: number,
	maxDelay: number,
	jitter: boolean,
): number {
	const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt);
	const delay = Math.min(exponentialDelay, maxDelay);

	if (jitter) {
		// Add random jitter ±25% to avoid thundering herd
		const jitterRange = delay * JITTER_FACTOR;
		return delay + (Math.random() * JITTER_MULTIPLIER - 1) * jitterRange;
	}

	return delay;
}

/**
 * Sleep for a specified number of milliseconds.
 */
async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff when rate limit errors (429) are encountered.
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function call
 * @throws The last error if all retry attempts fail
 */
export default async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const opts = { ...defaultOptions, ...options };
	let lastError: unknown;

	for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error: unknown) {
			lastError = error;

			// Only retry on rate limit errors
			if (!isRateLimitError(error)) {
				throw error;
			}

			// Don't wait after the last attempt
			if (attempt < opts.maxAttempts - 1) {
				const delay = calculateDelay(
					attempt,
					opts.initialDelay,
					opts.backoffFactor,
					opts.maxDelay,
					opts.jitter,
				);

				await sleep(delay);
			}
		}
	}

	// All attempts failed, throw the last error
	throw lastError;
}
