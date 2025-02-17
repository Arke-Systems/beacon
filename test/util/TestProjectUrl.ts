import { extname } from 'node:path';

// If this file is imported using a mapped path, like this:
//
// ```ts
// import readFixture from '#test/test/testProjectPath';
// ```
//
// Then import.meta.url resolves to this:
//
// ```plaintext
// file:///home/cnielsen/projects/beacon/test
// ```
//
// However, if it is imported using a relative path, like this:
//
// ```ts
// import readFixture from '../../../test/util/testProjectPath';
// ```
//
// Then import.meta.url resolve to this:
//
// ```plaintext
// file:///home/cnielsen/projects/beacon/test/util/testProjectPath.ts
// ```
//
// So we need to disambiguate the path when trying to load the fixtures.

const metaUrl = new URL(import.meta.url);

const TestProjectUrl = extname(metaUrl.pathname)
	? new URL('..', metaUrl)
	: metaUrl;

export default TestProjectUrl;
