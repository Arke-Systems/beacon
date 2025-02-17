import { fileURLToPath } from 'node:url';
import TestProjectUrl from '../util/TestProjectUrl.js';

export default function getSnapshotPath(filename: string) {
	return fileURLToPath(new URL(`snapshots/${filename}`, TestProjectUrl));
}
