export default class ApiTimeoutError extends Error {
	public constructor() {
		super('API timeout');
	}
}
