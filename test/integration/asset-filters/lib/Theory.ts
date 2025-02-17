export default class Theory {
	public constructor(
		public readonly action: 'pull' | 'push',
		public readonly cs: boolean,
		public readonly fs: boolean,
		public readonly included: boolean,
		public readonly identical: boolean,
		public readonly expected: 'create' | 'delete' | 'skip' | 'update',
	) {}
}
