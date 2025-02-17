import asciichart from 'asciichart';
import type { Histogram } from 'node:perf_hooks';
import { styleText } from 'node:util';
import process from 'process';
import type UiContext from './UiContext.js';
import createStylus from './createStylus.js';

const percent = 100;

export default function logApiPerformance(
	ui: UiContext,
	histogram: Histogram | undefined,
) {
	if (!histogram) {
		return;
	}

	const [lowerBound, upperBound] = graphBoundaries(histogram);
	const numOfBuckets = bucketCount();
	const bucketSize = Math.ceil((upperBound - lowerBound) / numOfBuckets);
	const buckets = new Array(numOfBuckets).fill(0) as number[];

	for (let i = 1; i <= histogram.count; i++) {
		const value = histogram.percentile((i / histogram.count) * percent);

		if (value >= lowerBound && value <= upperBound) {
			const bucketIndex = Math.min(
				Math.floor((value - lowerBound) / bucketSize),
				numOfBuckets - 1,
			);

			buckets[bucketIndex] = (buckets[bucketIndex] ?? 0) + 1;
		}
	}

	const f = new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1,
		style: 'decimal',
	});

	const maxBucketSize = Math.max(...buckets);
	const maxLabelLength = f.format(maxBucketSize).length;

	ui.info(
		'\n',
		styleText(['bold', 'underline'], 'API Performance'),
		'(Y-Axis: Requests; X-Axis: Duration)',
	);

	ui.info(
		asciichart.plot(buckets, {
			format: (yLabel) => ` ${f.format(yLabel).padStart(maxLabelLength)} `,
			height: 10,
		}),
	);

	logSummary(ui, histogram);
}

function graphBoundaries(histogram: Histogram) {
	const stdDeviationsToCapture = 2;
	const stdDeviations = stdDeviationsToCapture * histogram.stddev;
	const upperBound = Math.min(histogram.max, histogram.mean + stdDeviations);
	return [histogram.min, upperBound] as const;
}

function bucketCount() {
	const defaultColumns = 80;
	const yAxisSpace = 20;
	const columns = process.stdout.columns || defaultColumns;
	const available = columns - yAxisSpace;
	return Math.max(available, 1);
}

function logSummary(ui: UiContext, histogram: Histogram) {
	const y = createStylus('yellowBright');

	const minMax = new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 0,
		minimumFractionDigits: 0,
		style: 'unit',
		unit: 'millisecond',
	});

	const avg = new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: 'unit',
		unit: 'millisecond',
	});

	const align = (...items: { label: string; value: string }[]) => {
		const maxLabelLen = Math.max(...items.map(({ label }) => label.length));
		const maxValueLen = Math.max(...items.map(({ value }) => value.length));

		return items.map(({ label, value }) => {
			const paddedLabel = label.padEnd(maxLabelLen);
			const paddedValue = value.padStart(maxValueLen);
			const styled = styleText('yellowBright', paddedValue);
			return `${paddedLabel} ${styled}`;
		});
	};

	const [max, min] = align(
		{ label: 'Max:', value: minMax.format(histogram.max) },
		{ label: 'Min:', value: minMax.format(histogram.min) },
	);

	const [mean, stdDev] = align(
		{ label: 'Mean:', value: avg.format(histogram.mean) },
		{ label: 'StdDev:', value: avg.format(histogram.stddev) },
	);

	ui.info(y`${histogram.count.toLocaleString()} requests\n`);
	ui.info(min, '     ', mean);
	ui.info(max, '     ', stdDev);
}
