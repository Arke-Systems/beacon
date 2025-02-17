import type Client from '#cli/cs/api/Client.js';
import createAsset from '#cli/cs/assets/create.js';
import type AssetMeta from '#cli/schema/assets/AssetMeta.js';
import { load, save } from '#cli/schema/assets/lib/MetaSerialization.js';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type TestPushUiContext from '../../lib/TestPushUiContext.js';
import type Theory from './Theory.js';

export default async function arrange(
	theory: Theory,
	client: Client,
	currentFixturePath: string,
	originalFixturePath: string,
	ui: TestPushUiContext,
) {
	const originalPath = resolve(originalFixturePath, 'assets');

	const meta = await load({
		blobPath: resolve(originalPath, 'Badger_Warrior.blob.webp'),
		itemPath: 'Badger_Warrior.webp',
		metaPath: resolve(originalPath, 'Badger_Warrior.meta.webp.yaml'),
	});

	await Promise.all([
		arrangeCs(theory, client, meta, resolve(originalFixturePath, 'assets')),
		arrangeFs(theory, originalFixturePath, currentFixturePath, meta),
	]);

	ui.options.schema.assets.isIncluded = (path) =>
		path === 'Badger_Warrior.webp' && theory.included;
}

async function arrangeCs(
	theory: Theory,
	client: Client,
	meta: AssetMeta,
	originalFixturePath: string,
) {
	if (!theory.cs) {
		return;
	}

	await createAsset(client, {
		description: meta.description,
		filePath: resolve(originalFixturePath, meta.itemPath),
		tags: [...meta.tags],
		title: meta.title,
	});
}

async function copyBlob(
	originalFixturePath: string,
	currentFixturePath: string,
) {
	await copyFile(
		resolve(originalFixturePath, 'assets', 'Badger_Warrior.blob.webp'),
		resolve(currentFixturePath, 'assets', 'Badger_Warrior.blob.webp'),
	);
}

async function copyMeta(
	originalFixturePath: string,
	currentFixturePath: string,
) {
	await copyFile(
		resolve(originalFixturePath, 'assets', 'Badger_Warrior.meta.webp.yaml'),
		resolve(currentFixturePath, 'assets', 'Badger_Warrior.meta.webp.yaml'),
	);
}

async function createNewMeta(assetsFolderPath: string, meta: AssetMeta) {
	await save(resolve(assetsFolderPath, 'assets'), {
		...meta,
		description: 'Changed description',
	});
}

async function arrangeMeta(
	theory: Theory,
	originalFixturePath: string,
	currentFixturePath: string,
	meta: AssetMeta,
) {
	if (theory.identical) {
		await copyMeta(originalFixturePath, currentFixturePath);
	} else {
		await createNewMeta(currentFixturePath, meta);
	}
}

async function arrangeFs(
	theory: Theory,
	originalFixturePath: string,
	currentFixturePath: string,
	meta: AssetMeta,
) {
	if (!theory.fs) {
		return;
	}

	await mkdir(resolve(currentFixturePath, 'assets'), { recursive: true });

	await Promise.all([
		copyBlob(originalFixturePath, currentFixturePath),
		arrangeMeta(theory, originalFixturePath, currentFixturePath, meta),
	]);
}
