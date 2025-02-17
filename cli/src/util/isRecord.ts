export default function isRecord(o: unknown): o is Record<string, unknown> {
	return o !== null && typeof o === 'object';
}
