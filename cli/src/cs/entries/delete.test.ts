import { describe, expect, it, vi } from 'vitest';
import type Client from '../api/Client.js';
import deleteEntry from './delete.js';

describe('deleteEntry', () => {
	it('should delete entry with delete_all_localized=true by default', async () => {
		const mockClient = {
			DELETE: vi.fn().mockResolvedValue({
				error: undefined,
				response: { ok: true },
			}),
		} as unknown as Client;

		const result = await deleteEntry(
			mockClient,
			'test_content_type',
			'blt123456',
		);

		expect(result).toEqual({ deleted: true, notFound: false });

		expect(mockClient.DELETE).toHaveBeenCalledWith(
			'/v3/content_types/{content_type_uid}/entries/{entry_uid}',
			{
				params: {
					path: {
						content_type_uid: 'test_content_type',
						entry_uid: 'blt123456',
					},
					query: {
						delete_all_localized: 'true',
					},
				},
			},
		);
	});

	it('should delete entry with delete_all_localized=true when explicitly set', async () => {
		const mockClient = {
			DELETE: vi.fn().mockResolvedValue({
				error: undefined,
				response: { ok: true },
			}),
		} as unknown as Client;

		const result = await deleteEntry(
			mockClient,
			'test_content_type',
			'blt123456',
			true,
		);

		expect(result).toEqual({ deleted: true, notFound: false });

		expect(mockClient.DELETE).toHaveBeenCalledWith(
			'/v3/content_types/{content_type_uid}/entries/{entry_uid}',
			{
				params: {
					path: {
						content_type_uid: 'test_content_type',
						entry_uid: 'blt123456',
					},
					query: {
						delete_all_localized: 'true',
					},
				},
			},
		);
	});

	it('should delete only specific locale when deleteAllLocalized=false', async () => {
		const mockClient = {
			DELETE: vi.fn().mockResolvedValue({
				error: undefined,
				response: { ok: true },
			}),
		} as unknown as Client;

		const result = await deleteEntry(
			mockClient,
			'test_content_type',
			'blt123456',
			false,
		);

		expect(result).toEqual({ deleted: true, notFound: false });

		expect(mockClient.DELETE).toHaveBeenCalledWith(
			'/v3/content_types/{content_type_uid}/entries/{entry_uid}',
			{
				params: {
					path: {
						content_type_uid: 'test_content_type',
						entry_uid: 'blt123456',
					},
					query: {},
				},
			},
		);
	});

	it('should include locale parameter when provided', async () => {
		const mockClient = {
			DELETE: vi.fn().mockResolvedValue({
				error: undefined,
				response: { ok: true },
			}),
		} as unknown as Client;

		const result = await deleteEntry(
			mockClient,
			'test_content_type',
			'blt123456',
			true,
			'zh-cn',
		);

		expect(result).toEqual({ deleted: true, notFound: false });

		expect(mockClient.DELETE).toHaveBeenCalledWith(
			'/v3/content_types/{content_type_uid}/entries/{entry_uid}',
			{
				params: {
					path: {
						content_type_uid: 'test_content_type',
						entry_uid: 'blt123456',
					},
					query: {
						delete_all_localized: 'true',
						locale: 'zh-cn',
					},
				},
			},
		);
	});

	it('should handle entry not found error gracefully', async () => {
		const mockClient = {
			DELETE: vi.fn().mockResolvedValue({
				error: { error_code: 141 }, // EntryNotFound error code
				response: { ok: false },
			}),
		} as unknown as Client;

		// Should not throw when entry is not found, but return notFound flag
		const result = await deleteEntry(
			mockClient,
			'test_content_type',
			'blt123456',
		);

		expect(result).toEqual({ deleted: false, notFound: true });
	});

	it('should throw error when API returns other errors', async () => {
		const mockClient = {
			DELETE: vi.fn().mockResolvedValue({
				error: { error_code: 500, message: 'Server error' },
				response: { ok: false },
			}),
		} as unknown as Client;

		await expect(
			deleteEntry(mockClient, 'test_content_type', 'blt123456'),
		).rejects.toThrow();
	});

	it('should throw error when response is not ok and no error object', async () => {
		const mockClient = {
			DELETE: vi.fn().mockResolvedValue({
				error: undefined,
				response: { ok: false },
			}),
		} as unknown as Client;

		await expect(
			deleteEntry(mockClient, 'test_content_type', 'blt123456'),
		).rejects.toThrow('Failed to delete test_content_type entry: blt123456');
	});
});
