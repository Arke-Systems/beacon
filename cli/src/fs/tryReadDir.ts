import { readdir } from 'node:fs/promises';

const tryReadDir = async (...args: Parameters<typeof readdir>) => {
	try {
		return await readdir(...args);
	} catch (ex: unknown) {
		if (ex instanceof Error && 'code' in ex && ex.code === 'ENOENT') {
			return []; // Missing directory === empty directory
		}

		throw ex;
	}
};

export default tryReadDir;
