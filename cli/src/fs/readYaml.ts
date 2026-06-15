import type { PathLike } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

// UTF-16 Byte Order Mark (BOM) constants
const UTF16_LE_BOM_BYTE1 = 0xff;
const UTF16_LE_BOM_BYTE2 = 0xfe;
const UTF16_BE_BOM_BYTE1 = 0xfe;
const UTF16_BE_BOM_BYTE2 = 0xff;
const BYTES_PER_UTF16_CHAR = 2;

export default async function readYaml(pathLike: PathLike): Promise<unknown> {
	// Read as buffer first to detect encoding
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

	return parse(raw);
}
