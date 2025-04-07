import type { SchemaFields } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import type EntryWalker from '../EntryWalker.js';

export default function node(
	this: EntryWalker,
	schema: SchemaFields,
	container: Record<string, unknown>,
) {
	const ctx: NodeContext = {
		container,
		properties: new Map<string, unknown>(),
		schema,
		seen: new Set<string>(),
	};

	handleContainerProperties.call(this, ctx);
	handleSchemaProperties.call(this, ctx);

	const { properties } = ctx;
	return properties.size ? Object.fromEntries(properties) : undefined;
}

interface NodeContext {
	readonly container: Record<string, unknown>;
	readonly properties: Map<string, unknown>;
	readonly schema: SchemaFields;
	readonly seen: Set<string>;
}

function handleContainerProperties(this: EntryWalker, ctx: NodeContext) {
	for (const [fieldUid, value] of Object.entries(ctx.container)) {
		ctx.seen.add(fieldUid);

		if (fieldUid === '_metadata') {
			ctx.properties.set(fieldUid, value);
			continue;
		}

		const field = ctx.schema.find((f) => f.uid === fieldUid);
		if (!field) {
			const y = createStylus('yellowBright');
			const msg1 = y`Entry ${this.context} contains a field named`;
			const msg2 = y`${fieldUid} which is not defined in the schema.`;
			getUi().warn(msg1, msg2);
			ctx.properties.set(fieldUid, value);
			continue;
		}

		const processed = this.field(field, value);

		if (processed !== undefined) {
			ctx.properties.set(fieldUid, processed);
		}
	}
}

function handleSchemaProperties(this: EntryWalker, ctx: NodeContext) {
	for (const field of ctx.schema) {
		if (ctx.seen.has(field.uid)) {
			continue;
		}

		const processed = this.field(field, undefined);
		if (processed !== undefined) {
			ctx.properties.set(field.uid, processed);
		}
	}
}
