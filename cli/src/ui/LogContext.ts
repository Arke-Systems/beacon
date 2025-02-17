export default interface LogContext {
	readonly error: Console['warn'];
	readonly info: Console['info'];
	readonly warn: Console['warn'];
}
