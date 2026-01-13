/**
 * Escapes special regular expression characters in a string.
 *
 * This function makes a string safe to use as a literal pattern in a RegExp constructor
 * by escaping all characters that have special meaning in regular expressions.
 *
 * @param str - The string to escape
 * @returns The escaped string safe for use in a RegExp pattern
 *
 * @example
 * const filename = 'My.Entry.Title';
 * const pattern = new RegExp(`^${escapeRegex(filename)}\\.yaml$`, 'u');
 * // Creates pattern: /^My\.Entry\.Title\.yaml$/u
 */
export default function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
