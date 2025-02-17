import type { Entry, ReferencePath } from '../entries/Types.js';
import type { Schema, SchemaField, SchemaFields } from '../Types.js';
import field from './lib/field.js';
import globalField from './lib/globalField.js';
import globalFields from './lib/globalFields.js';
import group from './lib/group.js';
import groups from './lib/groups.js';
import modularBlock from './lib/modularBlock.js';
import modularBlocks from './lib/modularBlocks.js';
import node from './lib/node.js';
import referenceBlock from './lib/referenceBlock.js';
import resolveBlockTypes from './lib/resolveBlockTypes.js';
import schemaBlock from './lib/schemaBlock.js';

type CallbackFn = (field: SchemaField, value: unknown) => unknown;

export default class EntryWalker {
	protected readonly field: typeof field;
	protected readonly globalField: typeof globalField;
	protected readonly globalFields: typeof globalFields;
	protected readonly group: typeof group;
	protected readonly groups: typeof groups;
	protected readonly modularBlock: typeof modularBlock;
	protected readonly modularBlocks: typeof modularBlocks;
	protected readonly node: typeof node;
	protected readonly referenceBlock: typeof referenceBlock;
	protected readonly resolveBlockTypes: typeof resolveBlockTypes;
	protected readonly schemaBlock: typeof schemaBlock;

	public constructor(
		protected readonly globalFieldsByUid: ReadonlyMap<Schema['uid'], Schema>,
		protected readonly context: ReferencePath,
		protected readonly callback: CallbackFn,
	) {
		this.field = field.bind(this);
		this.globalField = globalField.bind(this);
		this.globalFields = globalFields.bind(this);
		this.group = group.bind(this);
		this.groups = groups.bind(this);
		this.modularBlock = modularBlock.bind(this);
		this.modularBlocks = modularBlocks.bind(this);
		this.node = node.bind(this);
		this.referenceBlock = referenceBlock.bind(this);
		this.resolveBlockTypes = resolveBlockTypes.bind(this);
		this.schemaBlock = schemaBlock.bind(this);
	}

	public process(schema: SchemaFields, entryNode: Entry): Entry {
		const metaProperties = new Map<string, unknown>();
		const entryProperties = new Map<string, unknown>();

		for (const [key, value] of Object.entries(entryNode)) {
			if (keysToRemove.has(key)) {
				continue;
			}

			if (metaKeys.has(key)) {
				metaProperties.set(key, value);
			} else {
				entryProperties.set(key, value);
			}
		}

		const result = this.node(schema, Object.fromEntries(entryProperties));

		return {
			title: entryNode.title,
			uid: entryNode.uid,
			...result,
			...Object.fromEntries(metaProperties),
		};
	}
}

const metaKeys = new Set<string>(['locale', 'tags']);

const keysToRemove = new Set<string>([
	'_in_progress',
	'_version',
	'ACL',
	'created_at',
	'created_by',
	'uid',
	'updated_at',
	'updated_by',
]);
