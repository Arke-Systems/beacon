import createStylus from './createStylus.js';

type Stylus = ReturnType<typeof createStylus>;

export default function humanizeList(
	items: readonly string[],
	opts?: {
		maxWidth?: number;
		stylus?: ReturnType<typeof createStylus>;
	},
): string {
	const sorted = [...items].sort();
	const bufferWidth = ', and 1,234 more...'.length;
	const maxWidth = opts?.maxWidth ?? (process.stdout.columns || Infinity);
	const limit = maxWidth - bufferWidth;
	const stylus = opts?.stylus ?? createStylus('yellowBright');

	return (
		none(sorted) ??
		one(sorted, limit, stylus) ??
		two(sorted, limit, stylus) ??
		many(sorted, limit, stylus)
	);
}

function none(sorted: readonly string[]) {
	if (sorted.length === 0) {
		return '';
	}
}

function one(sorted: readonly string[], limit: number, stylus: Stylus) {
	if (sorted.length !== 1) {
		return;
	}

	return stylus`${String(sorted[0])}`;
}

function two(sorted: readonly string[], limit: number, stylus: Stylus) {
	// Justification: Use an alternate grammar when there are only two items.
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	if (sorted.length !== 2) {
		return;
	}

	const first = String(sorted[0]);
	const second = String(sorted[1]);
	const visualWidth = first.length + ' and '.length + second.length;

	if (visualWidth > limit) {
		return stylus`${first} and ${'1'} more`;
	}

	return stylus`${first} and ${second}`;
}

function many(sorted: readonly string[], limit: number, stylus: Stylus) {
	const sepWidth = ', '.length;
	const listed = [];
	let visualWidth = 0;

	for (const item of sorted) {
		visualWidth += item.length + sepWidth;

		if (visualWidth > limit) {
			break;
		}

		listed.push(stylus`${item}`);
	}

	if (listed.length === sorted.length) {
		return `${listed.slice(0, -1).join(', ')}, and ${listed.slice(-1)[0]}`;
	}

	const remaining = sorted.length - listed.length;
	const final = stylus`, and ${remaining.toLocaleString()} more`;
	return listed.join(', ') + final;
}
