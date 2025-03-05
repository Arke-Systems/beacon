export const projectRoot = new URL('../../', import.meta.url);

export const src = new URL('./src/', projectRoot);
export const dist = new URL('./dist/', projectRoot);

export const configSchema = new URL('./cfg/Config.schema.yaml', src);
export const configDist = new URL('./cfg/Config.schema.yaml', dist);
export const configTypes = new URL('./Config.schema.d.yaml.ts', configSchema);
export const cliDist = new URL('./beacon.js', dist);
export const tsConfigUrl = new URL('./tsconfig.json', src);

export const licenseSrc = new URL('../LICENSE', projectRoot);
export const licenseDist = new URL('./LICENSE', projectRoot);

export const readmeSrc = new URL('../README.md', projectRoot);
export const readmeDist = new URL('./README.md', projectRoot);
