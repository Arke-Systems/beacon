import { describe, expect, it, vi } from 'vitest';
import type Client from '../api/Client.js';
import exportEntryLocale from './exportEntryLocale.js';

describe('exportEntryLocale', () => {
	it('should export entry with locale parameter', async () => {
		const mockEntry = {
			locale: 'en-us',
			title: 'Test Entry',
			uid: 'blt123456',
		};

		const mockClient = {
			GET: vi.fn().mockResolvedValue({
				data: mockEntry,
				error: undefined,
			}),
		} as unknown as Client;

		const result = await exportEntryLocale(
			'test_content_type',
			mockClient,
			'blt123456',
			'en-us',
		);

		expect(result).toEqual(mockEntry);
		expect(mockClient.GET).toHaveBeenCalledWith(
			'/v3/content_types/{content_type_uid}/entries/{entry_uid}/export',
			{
				params: {
					path: {
						content_type_uid: 'test_content_type',
						entry_uid: 'blt123456',
					},
					query: {
						locale: 'en-us',
					},
				},
			},
		);
	});

	it('should throw error when API returns error', async () => {
		const mockClient = {
			GET: vi.fn().mockResolvedValue({
				data: undefined,
				error: { message: 'Not found' },
			}),
		} as unknown as Client;

		await expect(
			exportEntryLocale('test_content_type', mockClient, 'blt123456', 'fr'),
		).rejects.toThrow();
	});

	it('should throw error when response is not a valid entry', async () => {
		const mockClient = {
			GET: vi.fn().mockResolvedValue({
				data: { invalid: 'data' },
				error: undefined,
			}),
		} as unknown as Client;

		await expect(
			exportEntryLocale('test_content_type', mockClient, 'blt123456', 'de'),
		).rejects.toThrow(
			'Failed to export test_content_type entry: blt123456 (locale: de)',
		);
	});

	it('should handle different locale codes correctly', async () => {
		const locales = ['en-us', 'fr-fr', 'de', 'zh_CN', 'es-mx'];

		for (const locale of locales) {
			const mockEntry = {
				locale,
				title: 'Test Entry',
				uid: 'blt123456',
			};

			const mockClient = {
				GET: vi.fn().mockResolvedValue({
					data: mockEntry,
					error: undefined,
				}),
			} as unknown as Client;

			const result = await exportEntryLocale(
				'test_content_type',
				mockClient,
				'blt123456',
				locale,
			);

			expect(result.locale).toBe(locale);
			expect(mockClient.GET).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					params: expect.objectContaining({
						query: { locale },
					}),
				}),
			);
		}
	});
});
