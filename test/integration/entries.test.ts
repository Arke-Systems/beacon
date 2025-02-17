import { createClient } from '#cli/cs/api/Client.js';
import ContentstackError from '#cli/cs/api/ContentstackError.js';
import deleteEntry from '#cli/cs/entries/delete.js';
import exportEntry from '#cli/cs/entries/export.js';
import importEntry from '#cli/cs/entries/import.js';
import type { Entry } from '#cli/cs/entries/Types.js';
import equality from '#cli/schema/entries/equality.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, test, vi } from 'vitest';
import contentTypeFixture from './lib/contentTypeFixture.js';
import createEntry from './lib/createEntry.js';
import TestPushUiContext from './lib/TestPushUiContext.js';
import updateEntry from './lib/updateEntry.js';

vi.mock(import('#cli/ui/HandledError.js'));

describe('Entries', () => {
	const ui = new TestPushUiContext('');
	const client = createClient(ui);
	const contentType = contentTypeFixture(client);
	afterAll(async () => client[Symbol.asyncDispose]());

	test('An exported entry should match the entry', async () => {
		// Arrange
		await using entry = await createEntry(client, contentType.uid);

		// Act
		const exported = await exportEntry(contentType.uid, client, entry.uid);

		// Assert
		expect(equality(exported, entry)).toBe(true);
	});

	test('Exports should capture mutations', async () => {
		// Arrange
		await using entry = await createEntry(client, contentType.uid);
		const title = randomUUID();

		// Act
		await updateEntry(client, contentType.uid, { title, uid: entry.uid });
		const reexported = await exportEntry(contentType.uid, client, entry.uid);

		// Assert
		expect(equality(reexported, entry)).toBe(false);
		expect(reexported.title).toBe(title);
	});

	test('Imports should create new entries as needed', async () => {
		// Arrange
		await using entry = await createEntry(client, contentType.uid);
		const exported = await exportEntry(contentType.uid, client, entry.uid);
		await deleteEntry(client, contentType.uid, entry.uid);

		// Act
		const imported = await importEntry(
			client,
			contentType.uid,
			exported,
			false,
		);

		const reexported = await exportEntry(contentType.uid, client, imported.uid);

		// Assert
		expect(imported.uid).not.toStrictEqual(exported.uid);

		const entries = [entry, exported, imported, reexported];

		entries.forEach((x) => {
			entries.forEach((y) => {
				expect(equality(x, y)).toBe(true);
			});
		});
	});

	test('Imports should modify existing entries as needed', async () => {
		// Arrange
		await using entry = await createEntry(client, contentType.uid);
		const exported = await exportEntry(contentType.uid, client, entry.uid);
		const newTitle = randomUUID();
		const modified = { ...exported, title: newTitle };

		// Act
		const imported = await importEntry(client, contentType.uid, modified, true);
		const reexported = await exportEntry(contentType.uid, client, exported.uid);

		// Assert
		expect(entry.title).not.toStrictEqual(newTitle);
		expect(exported.title).not.toStrictEqual(newTitle);
		expect(modified.title).toStrictEqual(newTitle);
		expect(imported.title).toStrictEqual(newTitle);
		expect(reexported.title).toStrictEqual(newTitle);

		const entries = [entry, exported, modified, imported, reexported];
		const uids = entries.map((x) => x.uid);
		const uniqueUids = new Set(uids);
		expect(uniqueUids.size).toBe(1);
	});

	test('Imports should emit errors for bad data', async () => {
		// Arrange
		// This creates "bad data" by updating a title to a bad data type.
		await using entry = await createEntry(client, contentType.uid);
		const exported = await exportEntry(contentType.uid, client, entry.uid);
		const modified = { ...exported, title: 1234 } as unknown as Entry;

		// Act
		const fn = async () =>
			Store.run(ui, async () =>
				importEntry(client, contentType.uid, modified, true),
			);

		// Assert
		await expect(fn).rejects.toThrowError(ContentstackError);
	});
});
