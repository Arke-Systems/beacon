import { describe, expect, it, vi } from 'vitest';
import type Client from '../api/Client.js';
import getEntryLocales from './getEntryLocales.js';

describe('getEntryLocales', () => {
	it('should return locales from successful API response', async () => {
		const mockLocales = [
			{
				code: 'en-us',
				name: 'English - United States',
				uid: 'blt1234567890abcdef',
			},
			{
				code: 'fr',
				name: 'French',
				uid: 'blt0987654321fedcba',
			},
		];

		const mockClient = {
			GET: vi.fn().mockResolvedValue({
				data: { locales: mockLocales },
				error: undefined,
			}),
		} as unknown as Client;

		const result = await getEntryLocales(
			mockClient,
			'test_content_type',
			'bltentry123',
		);

		expect(result).toEqual(mockLocales);
		expect(mockClient.GET).toHaveBeenCalledWith(
			'/v3/content_types/{content_type_uid}/entries/{entry_uid}/locales',
			{
				params: {
					path: {
						content_type_uid: 'test_content_type',
						entry_uid: 'bltentry123',
					},
				},
			},
		);
	});

	it('should throw error when API returns error', async () => {
		const mockClient = {
			GET: vi.fn().mockResolvedValue({
				data: undefined,
				error: { message: 'Entry not found' },
			}),
		} as unknown as Client;

		await expect(
			getEntryLocales(mockClient, 'test_content_type', 'bltentry123'),
		).rejects.toThrow();
	});

	it('should throw error when response is not valid LocalesResponse', async () => {
		const mockClient = {
			GET: vi.fn().mockResolvedValue({
				data: { invalid: 'structure' },
				error: undefined,
			}),
		} as unknown as Client;

		await expect(
			getEntryLocales(mockClient, 'test_content_type', 'bltentry123'),
		).rejects.toThrow(
			'Failed to get locales for test_content_type entry: bltentry123',
		);
	});

	it('should handle locales with optional fallback_locale', async () => {
		const mockLocales = [
			{
				code: 'en-us',
				name: 'English - United States',
				uid: 'blt1234567890abcdef',
			},
			{
				code: 'fr-ca',
				fallback_locale: 'en-us',
				name: 'French - Canada',
				uid: 'bltabcdef1234567890',
			},
		];

		const mockClient = {
			GET: vi.fn().mockResolvedValue({
				data: { locales: mockLocales },
				error: undefined,
			}),
		} as unknown as Client;

		const result = await getEntryLocales(
			mockClient,
			'test_content_type',
			'bltentry123',
		);

		expect(result).toEqual(mockLocales);
		expect(result[1]?.fallback_locale).toBe('en-us');
	});
});
