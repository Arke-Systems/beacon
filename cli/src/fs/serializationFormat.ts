import type { SerializationFormat } from '../ui/Options.js';

/**
 * Get the file extension for the given serialization format.
 * @param format The serialization format ('yaml' or 'json')
 * @returns The file extension including the dot (e.g., '.yaml' or '.json')
 */
export function getFileExtension(format: SerializationFormat): string {
	return format === 'json' ? '.json' : '.yaml';
}

/**
 * Create a regex pattern to match files with the given base name and format.
 * @param baseFilename The base filename (without extension)
 * @param format The serialization format
 * @returns A regex pattern string
 */
export function getFilePattern(
	baseFilename: string,
	format: SerializationFormat,
): string {
	const ext = format === 'json' ? 'json' : 'yaml';
	return `${escapeRegex(baseFilename)}\\.${ext}$`;
}

/**
 * Create a regex pattern to match locale-specific entry files.
 * @param baseFilename The base filename (without extension)
 * @param format The serialization format
 * @returns A regex pattern
 */
export function getLocaleFilePattern(
	baseFilename: string,
	format: SerializationFormat,
): RegExp {
	const ext = format === 'json' ? 'json' : 'yaml';
	return new RegExp(`^${escapeRegex(baseFilename)}\\.([^.]+)\\.${ext}$`, 'u');
}

/**
 * Get all supported file extensions for format detection.
 * @returns Array of extensions
 */
export function getSupportedExtensions(): string[] {
	return ['.yaml', '.yml', '.json'];
}

/**
 * Detect serialization format from file path.
 * @param filePath The file path
 * @returns The detected format, or 'yaml' as default
 */
export function detectFormat(filePath: string): SerializationFormat {
	if (filePath.toLowerCase().endsWith('.json')) {
		return 'json';
	}
	return 'yaml';
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
	return str.replace(/[\\^$.*+?()[\]{}|]/gu, '\\$&');
}
