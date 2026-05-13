import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import retryWithBackoff from './retryWithBackoff.js';

// Test constants
const ONE_CALL = 1;
const TWO_CALLS = 2;
const THREE_CALLS = 3;
const TEN_MS = 10;
const TWENTY_MS = 20;
const SEVENTY_FIVE_MS = 75;
const ONE_HUNDRED_MS = 100;
const TWO_HUNDRED_MS = 200;
const ONE_THOUSAND_MS = 1000;
const TEN_THOUSAND_MS = 10000;
const ONE_HUNDRED_FACTOR = 100;
const TWO_FACTOR = 2;
const THREE_ATTEMPTS = 3;
const FIVE_HUNDRED_ERROR = 500;
const JITTER_HALF = 0.5;
const JITTER_ZERO = 0;

describe('retryWithBackoff', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('should succeed on first attempt', async () => {
		const fn = vi.fn<() => Promise<string>>().mockResolvedValue('success');

		const result: string = await retryWithBackoff(fn);

		expect(result).toBe('success');
		expect(fn).toHaveBeenCalledTimes(ONE_CALL);
	});

	it('should retry on rate limit error (429)', async () => {
		const rateLimitError = {
			error_code: 429,
			error_message: 'Rate limit exceeded',
		};
		const fn = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(rateLimitError)
			.mockResolvedValueOnce('success');

		const promise = retryWithBackoff(fn, {
			initialDelay: TEN_MS,
			jitter: false,
		});

		// Advance timer to trigger retry
		await vi.advanceTimersByTimeAsync(TEN_MS);
		const result = await promise;

		expect(result).toBe('success');
		expect(fn).toHaveBeenCalledTimes(TWO_CALLS);
	});

	it('should not retry on non-rate-limit errors', async () => {
		const otherError = {
			error_code: FIVE_HUNDRED_ERROR,
			error_message: 'Server error',
		};
		const fn = vi.fn<() => Promise<string>>().mockRejectedValue(otherError);

		await expect(retryWithBackoff(fn)).rejects.toEqual(otherError);
		expect(fn).toHaveBeenCalledTimes(ONE_CALL);
	});

	it('should throw after max attempts', async () => {
		const rateLimitError = {
			error_code: 429,
			error_message: 'Rate limit exceeded',
		};
		const fn = vi.fn<() => Promise<string>>().mockRejectedValue(rateLimitError);

		const promise = retryWithBackoff(fn, {
			initialDelay: TEN_MS,
			jitter: false,
			maxAttempts: THREE_ATTEMPTS,
		});

		// Advance timers for both retries and let promise settle
		const expectPromise = expect(promise).rejects.toEqual(rateLimitError);
		await vi.advanceTimersByTimeAsync(TEN_MS); // First retry
		await vi.advanceTimersByTimeAsync(TWENTY_MS); // Second retry
		await expectPromise;

		expect(fn).toHaveBeenCalledTimes(THREE_CALLS);
	});

	it('should apply exponential backoff', async () => {
		const rateLimitError = {
			error_code: 429,
			error_message: 'Rate limit exceeded',
		};
		const fn = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(rateLimitError)
			.mockRejectedValueOnce(rateLimitError)
			.mockResolvedValueOnce('success');

		const promise = retryWithBackoff(fn, {
			backoffFactor: TWO_FACTOR,
			initialDelay: ONE_HUNDRED_MS,
			jitter: false,
			maxDelay: TEN_THOUSAND_MS,
		});

		// Verify exponential backoff: first retry 100ms, second retry 200ms
		await vi.advanceTimersByTimeAsync(ONE_HUNDRED_MS);
		expect(fn).toHaveBeenCalledTimes(TWO_CALLS);

		await vi.advanceTimersByTimeAsync(TWO_HUNDRED_MS);
		const result = await promise;

		expect(result).toBe('success');
		expect(fn).toHaveBeenCalledTimes(THREE_CALLS);
	});

	it('should respect maxDelay', async () => {
		const rateLimitError = {
			error_code: 429,
			error_message: 'Rate limit exceeded',
		};
		const fn = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(rateLimitError)
			.mockRejectedValueOnce(rateLimitError)
			.mockResolvedValueOnce('success');

		const promise = retryWithBackoff(fn, {
			backoffFactor: ONE_HUNDRED_FACTOR,
			initialDelay: ONE_THOUSAND_MS,
			jitter: false,
			maxDelay: TWO_HUNDRED_MS, // Cap delays at 200ms
		});

		// Both retries should use maxDelay (200ms), not exponential values
		await vi.advanceTimersByTimeAsync(TWO_HUNDRED_MS);
		expect(fn).toHaveBeenCalledTimes(TWO_CALLS);

		await vi.advanceTimersByTimeAsync(TWO_HUNDRED_MS);
		const result = await promise;

		expect(result).toBe('success');
		expect(fn).toHaveBeenCalledTimes(THREE_CALLS);
	});

	it('should handle jitter option', async () => {
		const rateLimitError = {
			error_code: 429,
			error_message: 'Rate limit exceeded',
		};

		// Mock Math.random to return predictable values
		const mockRandom = vi.spyOn(Math, 'random');
		mockRandom.mockReturnValueOnce(JITTER_HALF); // Returns 0 jitter (no offset)

		const fn = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(rateLimitError)
			.mockResolvedValueOnce('success');

		const promise = retryWithBackoff(fn, {
			initialDelay: ONE_HUNDRED_MS,
			jitter: true,
		});

		// With Math.random() = 0.5, jitter = delay + (0.5 * 2 - 1) * (delay * 0.25)
		// = 100 + 0 * 25 = 100ms
		await vi.advanceTimersByTimeAsync(ONE_HUNDRED_MS);
		const result = await promise;

		expect(result).toBe('success');
		expect(mockRandom).toHaveBeenCalled();

		// Test with different random value
		mockRandom.mockReturnValueOnce(JITTER_ZERO); // Returns -25% jitter

		const fn2 = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(rateLimitError)
			.mockResolvedValueOnce('success');

		const promise2 = retryWithBackoff(fn2, {
			initialDelay: ONE_HUNDRED_MS,
			jitter: true,
		});

		// With Math.random() = 0, jitter = 100 + (0 * 2 - 1) * 25 = 100 - 25 = 75ms
		await vi.advanceTimersByTimeAsync(SEVENTY_FIVE_MS);
		const result2 = await promise2;

		expect(result2).toBe('success');
	});

	it('should handle non-object errors', async () => {
		const stringError = 'Some error';
		const fn = vi.fn<() => Promise<string>>().mockRejectedValue(stringError);

		await expect(retryWithBackoff(fn)).rejects.toBe(stringError);
		expect(fn).toHaveBeenCalledTimes(ONE_CALL);
	});

	it('should handle null/undefined errors', async () => {
		const fn = vi.fn<() => Promise<string>>().mockRejectedValue(null);

		await expect(retryWithBackoff(fn)).rejects.toBeNull();
		expect(fn).toHaveBeenCalledTimes(ONE_CALL);
	});
});
