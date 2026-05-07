import { MutableTransferResults } from '#cli/schema/xfer/TransferResults.js';
import type Theory from './Theory.js';

export default function expected(theory: Theory) {
	const result = new MutableTransferResults();

	// When an asset is excluded (included: false), it should not appear in any
	// result set because it's not loaded into memory at all
	if (!theory.included) {
		// Asset is excluded - no results expected
		return result;
	}

	switch (theory.expected) {
		case 'create':
			result.created.add('Badger_Warrior.webp');
			break;
		case 'delete':
			result.deleted.add('Badger_Warrior.webp');
			break;
		case 'update':
			result.updated.add('Badger_Warrior.webp');
			break;
		case 'skip':
			result.unmodified.add('Badger_Warrior.webp');
			break;
	}

	return result;
}
