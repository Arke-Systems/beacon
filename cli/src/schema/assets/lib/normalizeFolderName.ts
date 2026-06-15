/**
 * Normalizes folder names - preserves spaces.
 * Spaces are valid in Contentstack folder names and should be preserved
 * to avoid creating duplicate folders during push operations.
 *
 * @param name - The folder name from Contentstack
 * @returns The folder name unchanged (spaces preserved)
 */
export default function normalizeFolderName(name: string): string {
	return name;
}
