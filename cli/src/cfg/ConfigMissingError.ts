export default class ConfigMissingError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = 'ConfigMissingError';
	}
}
