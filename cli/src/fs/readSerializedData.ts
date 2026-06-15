import type { PathLike } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { parse as parseYaml } from 'yaml';

/**
 * Read and parse a serialized data file (YAML or JSON).
 * Format is auto-detected based on file extension.
 */
export default async function readSerializedData(
	pathLike: PathLike,
): Promise<unknown> {
	const ext = extname(String(pathLike)).toLowerCase();

	// Read as buffer first to detect and handle encoding/BOM
	const buffer = await readFile(pathLike);

	// Check for UTF-16 LE BOM (FF FE)
	let raw: string;
	if (buffer[0] === UTF16_LE_BOM_BYTE1 && buffer[1] === UTF16_LE_BOM_BYTE2) {
		raw = buffer.toString('utf16le');
	}
	// Check for UTF-16 BE BOM (FE FF)
	else if (
		buffer[0] === UTF16_BE_BOM_BYTE1 &&
		buffer[1] === UTF16_BE_BOM_BYTE2
	) {
		// Note: Node.js doesn't have built-in utf16be, so we swap bytes
		const swapped = Buffer.alloc(buffer.length);
		for (let i = 0; i < buffer.length; i += BYTES_PER_UTF16_CHAR) {
			const byte1 = buffer[i + 1];
			const byte2 = buffer[i];
			if (byte1 !== undefined) swapped[i] = byte1;
			if (byte2 !== undefined) swapped[i + 1] = byte2;
		}
		raw = swapped.toString('utf16le');
	}
	// Default to UTF-8
	else {
		raw = buffer.toString('utf-8');
	}

	// Strip UTF-8 BOM if present (EF BB BF decoded as U+FEFF)
	if (raw.charCodeAt(0) === UTF8_BOM_CHAR) {
		raw = raw.slice(1);
	}

	// Parse based on file extension
	if (ext === '.json') {
		return JSON.parse(raw);
	}

	// Default to YAML parsing (handles .yaml, .yml, or no extension)
	return parseYaml(raw);
}

// Byte Order Mark (BOM) constants
const UTF16_LE_BOM_BYTE1 = 0xff;
const UTF16_LE_BOM_BYTE2 = 0xfe;
const UTF16_BE_BOM_BYTE1 = 0xfe;
const UTF16_BE_BOM_BYTE2 = 0xff;
const BYTES_PER_UTF16_CHAR = 2;
const UTF8_BOM_CHAR = 0xfeff; // UTF-8 BOM character code
