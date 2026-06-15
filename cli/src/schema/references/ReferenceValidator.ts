import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry, ReferencePath } from '#cli/cs/entries/Types.js';
import type { SchemaField } from '#cli/cs/Types.js';
import isRecord from '#cli/util/isRecord.js';
import type { InvalidReference } from './InvalidReference.js';

interface RichTextMetadata {
	field_metadata: {
		rich_text_type: string;
	};
}

function hasRichTextMetadata(
	schema: SchemaField,
): schema is RichTextMetadata & SchemaField {
	return (
		isRecord(schema) &&
		isRecord(schema.field_metadata) &&
		typeof schema.field_metadata.rich_text_type === 'string'
	);
}

export interface ReferenceValidatorContext {
	readonly assets: {
		has(uid: string): boolean;
	};
	readonly contentTypes: ReadonlyMap<ContentType['uid'], ContentType>;
	readonly entries: {
		byTypedUid: ReadonlyMap<`${ContentType['uid']}/${Entry['uid']}`, Entry>;
	};
}

export default class ReferenceValidator {
	readonly #currentEntry: ReferencePath;
	readonly #currentFieldPath: string[] = [];
	readonly #ctx: ReferenceValidatorContext;
	readonly #invalidReferences: InvalidReference[] = [];

	public constructor(ctx: ReferenceValidatorContext, entryPath: ReferencePath) {
		this.#ctx = ctx;
		this.#currentEntry = entryPath;
	}

	public get invalidReferences(): readonly InvalidReference[] {
		return this.#invalidReferences;
	}

	public process = (schema: SchemaField, value: unknown): unknown => {
		this.#currentFieldPath.push(schema.uid);

		try {
			return this.#processField(schema, value);
		} finally {
			this.#currentFieldPath.pop();
		}
	};

	#processField(schema: SchemaField, value: unknown): unknown {
		if (value === null || value === undefined) {
			return value;
		}

		switch (schema.data_type) {
			case 'reference':
				return this.#validateReferences(value);

			case 'json':
				// JSON RTE may contain asset or entry references
				return this.#validateJsonRte(value);

			case 'text':
				// HTML RTE may contain asset references
				if (
					hasRichTextMetadata(schema) &&
					schema.field_metadata.rich_text_type === 'advanced'
				) {
					return this.#validateHtmlRte(value);
				}
				return value;

			default:
				return value;
		}
	}

	#validateReferences(value: unknown): unknown {
		if (!Array.isArray(value)) {
			this.#recordIssue(
				'invalid-structure',
				'unknown',
				'unknown',
				'Reference field should be an array',
			);
			return value;
		}

		for (const ref of value) {
			this.#validateSingleReference(ref);
		}

		return value;
	}

	#validateSingleReference(ref: unknown): void {
		if (!isRecord(ref)) {
			this.#recordIssue(
				'invalid-structure',
				'unknown',
				'unknown',
				'Reference should be an object',
			);
			return;
		}

		const { _content_type_uid, uid } = ref;

		if (typeof uid !== 'string' || typeof _content_type_uid !== 'string') {
			this.#recordIssue(
				'invalid-structure',
				String(_content_type_uid),
				String(uid),
				'Reference missing uid or _content_type_uid',
			);
			return;
		}

		// Check if content type exists
		if (!this.#ctx.contentTypes.has(_content_type_uid)) {
			this.#recordIssue(
				'missing-content-type',
				_content_type_uid,
				uid,
				`Content type '${_content_type_uid}' does not exist`,
			);
			return;
		}

		// Check if entry exists
		const typedUid = `${_content_type_uid}/${uid}` as const;
		if (!this.#ctx.entries.byTypedUid.has(typedUid)) {
			this.#recordIssue(
				'missing-entry',
				_content_type_uid,
				uid,
				`Entry with uid '${uid}' in content type '${_content_type_uid}' does not exist`,
			);
		}
	}

	#validateJsonRte(value: unknown): unknown {
		if (!isRecord(value)) {
			return value;
		}

		// JSON RTE has a nested structure with nodes
		if (isRecord(value.children) || Array.isArray(value.children)) {
			this.#walkJsonRteNodes(value.children);
		}

		return value;
	}

	#walkJsonRteNodes(nodes: unknown): void {
		if (!Array.isArray(nodes)) {
			return;
		}

		for (const node of nodes) {
			if (!isRecord(node)) {
				continue;
			}

			// Check for asset references
			if (node.type === 'reference') {
				const { attrs } = node;
				if (isRecord(attrs)) {
					const assetUid = attrs['asset-uid'];
					const displayType = attrs['display-type'];

					if (
						displayType === 'asset' &&
						typeof assetUid === 'string' &&
						!this.#ctx.assets.has(assetUid)
					) {
						this.#recordIssue(
							'missing-asset',
							'sys_assets',
							assetUid,
							`Asset '${assetUid}' does not exist`,
						);
					}
				}
			}

			// Recursively check children
			if (Array.isArray(node.children)) {
				this.#walkJsonRteNodes(node.children);
			}
		}
	}

	#validateHtmlRte(value: unknown): unknown {
		if (typeof value !== 'string') {
			return value;
		}

		// Look for asset references in HTML
		// Pattern: sys_assets/blt...
		const assetPattern = /sys_assets\/(?<uid>blt[a-f0-9]+)/gu;
		let match;

		while ((match = assetPattern.exec(value)) !== null) {
			const [, assetUid] = match;
			if (assetUid && !this.#ctx.assets.has(assetUid)) {
				this.#recordIssue(
					'missing-asset',
					'sys_assets',
					assetUid,
					`Asset '${assetUid}' referenced in HTML RTE does not exist`,
				);
			}
		}

		return value;
	}

	#recordIssue(
		issueType: InvalidReference['issueType'],
		toContentTypeUid: string,
		toIdentifier: string,
		details?: string,
	): void {
		const issue: InvalidReference = {
			...(details ? { details } : {}),
			fieldPath: this.#currentFieldPath.join('.'),
			fromEntry: this.#currentEntry,
			issueType,
			toContentTypeUid,
			toIdentifier,
		};
		this.#invalidReferences.push(issue);
	}
}
