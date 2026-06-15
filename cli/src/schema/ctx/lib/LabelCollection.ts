import type Label from '#cli/cs/labels/Label.js';
import type NormalizedLabel from '#cli/dto/label/NormalizedLabel.js';

export default interface LabelCollection {
	readonly byName: ReadonlyMap<Label['name'], NormalizedLabel>;
	create(normalized: NormalizedLabel): Promise<void>;
	remove(normalized: NormalizedLabel): Promise<void>;
	update(normalized: NormalizedLabel): Promise<void>;
}
