import TestProjectUrl from '#test/util/TestProjectUrl';
import { readFile } from 'node:fs/promises';

export default async function readFixture(filename: string) {
	const fixutreUrl = new URL(`fixtures/${filename}`, TestProjectUrl);
	return readFile(fixutreUrl, 'utf-8');
}
