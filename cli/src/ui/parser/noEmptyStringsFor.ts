import { InvalidArgumentError } from 'commander';

// makeOptionMandatory allows empty string to pass.
export default function noEmptyStringsFor(name: string) {
	return (value: string) => {
		if (value) {
			return value;
		}

		throw new InvalidArgumentError(`${name} is required`);
	};
}
