import { relative } from 'node:path';

export default function humanizePath(absolutePath: string) {
	const relativePath = relative(process.cwd(), absolutePath);

	if (relativePath.startsWith('../')) {
		return absolutePath;
	}

	if (relativePath === '') {
		return '.';
	}

	return relativePath;
}
