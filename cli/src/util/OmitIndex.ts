type OmitIndex<T> = {
	// Justification: This is used to remove an index signature from an object
	// type, and the {} is needed instead of `unknown` or `object`.
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	[K in keyof T as {} extends Record<K, 1> ? never : K]: T[K];
};

export default OmitIndex;
