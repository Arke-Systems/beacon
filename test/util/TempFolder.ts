import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { dirname } from 'node:path';

export default class TempFolder implements AsyncDisposable {
	private constructor(public readonly absPath: string) {}

	public static async create(rootPath: string): Promise<TempFolder> {
		await mkdir(dirname(rootPath), { recursive: true });
		const absPath = await mkdtemp(rootPath);
		return new TempFolder(absPath);
	}

	public async [Symbol.asyncDispose](): Promise<void> {
		await rm(this.absPath, { force: true, recursive: true });
	}
}
