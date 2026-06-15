import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import readSerializedData from './readSerializedData.js';
import writeSerializedData from './writeSerializedData.js';

const testDir = fileURLToPath(
	new URL('./.test-serialization', import.meta.url),
);

describe('Serialization I/O', () => {
	beforeEach(async () => {
		await mkdir(testDir, { recursive: true });
	});

	afterEach(async () => {
		await rm(testDir, { force: true, recursive: true });
	});

	describe('YAML format', () => {
		it('writes and reads YAML data correctly', async () => {
			const filePath = resolve(testDir, 'test.yaml');
			const data = {
				content: 'This is content',
				nested: {
					field: 'value',
				},
				tags: ['tag1', 'tag2'],
				title: 'Test Entry',
			};

			await writeSerializedData(filePath, data, 'yaml');
			const result = await readSerializedData(filePath);

			expect(result).toEqual(data);
		});
	});

	describe('JSON format', () => {
		it('writes and reads JSON data correctly', async () => {
			const filePath = resolve(testDir, 'test.json');
			const data = {
				content: 'This is content',
				nested: {
					field: 'value',
				},
				tags: ['tag1', 'tag2'],
				title: 'Test Entry',
			};

			await writeSerializedData(filePath, data, 'json');
			const result = await readSerializedData(filePath);

			expect(result).toEqual(data);
		});

		it('writes JSON with proper formatting', async () => {
			const filePath = resolve(testDir, 'test.json');
			const data = { key: 'value' };

			await writeSerializedData(filePath, data, 'json');
			const fs = await import('node:fs/promises');
			const content = await fs.readFile(filePath, 'utf-8');

			// Should be pretty-printed with 2-space indentation
			expect(content).toContain('  ');
			expect(content).toContain('{\n');
			expect(content).toContain('\n}');
		});
	});

	describe('Auto-detection', () => {
		it('reads .yaml files as YAML', async () => {
			const filePath = resolve(testDir, 'auto.yaml');
			const data = { format: 'yaml' };

			await writeSerializedData(filePath, data, 'yaml');
			const result = await readSerializedData(filePath);

			expect(result).toEqual(data);
		});

		it('reads .json files as JSON', async () => {
			const filePath = resolve(testDir, 'auto.json');
			const data = { format: 'json' };

			await writeSerializedData(filePath, data, 'json');
			const result = await readSerializedData(filePath);

			expect(result).toEqual(data);
		});
	});
});
