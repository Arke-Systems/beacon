# Multi-Language Support

This document addresses common questions about Beacon's multi-language (localization) support for entries.

## File System Structure for Locale-Specific Versions

Beacon uses a filename-based convention to handle locale-specific versions of entries:

### Single-Locale Format (Backward Compatible)

For projects with only one locale, entries are stored without a locale suffix:

```
schema/entries/event/Entry Title.yaml
```

### Multi-Locale Format

When an entry exists in multiple locales, each locale version is stored separately with a locale suffix:

```
schema/entries/event/Entry Title.en-us.yaml
schema/entries/event/Entry Title.fr-ca.yaml
schema/entries/event/Entry Title.de.yaml
```

The locale code must be a valid locale identifier (2-3 letter language code, optionally followed by a hyphen or underscore and a 2-4 letter region code). Examples: `en`, `en-us`, `fr-CA`, `zh_CN`.

**Implementation**: See [`loadEntryLocales.ts`](../../cli/src/schema/entries/lib/loadEntryLocales.ts) and [`toFilesystem.ts`](../../cli/src/schema/entries/toFilesystem.ts).

## Backward Compatibility

The multi-language implementation maintains full backward compatibility with projects that have already serialized content:

1. **Single-locale files**: Files without locale suffixes (e.g., `Entry.yaml`) are treated as having locale `'default'`. This ensures existing serialized content continues to work.

2. **Automatic detection**: When loading entries from the filesystem, Beacon checks for both patterns:
   - Multi-locale: `Entry.{locale}.yaml`
   - Single-locale: `Entry.yaml`

3. **Smart serialization**: During pull operations:
   - If an entry has only one locale version, it's saved **without** a locale suffix (backward compatible)
   - If an entry has multiple locale versions, all are saved **with** locale suffixes

4. **Loading preference**: When indexing filesystem entries, if both patterns exist, the code prefers: `default` locale → `en-us` → first available locale.

**Implementation**:

- Reading: [`loadEntryLocales.ts`](../../cli/src/schema/entries/lib/loadEntryLocales.ts) lines 72-102
- Writing: [`toFilesystem.ts`](../../cli/src/schema/entries/toFilesystem.ts) lines 79-83
- Indexing: [`indexAllFsEntries.ts`](../../cli/src/schema/entries/indexAllFsEntries.ts) lines 122-130

## Non-Localizable Fields on Locale-Specific Versions

**Current Implementation**: All fields from each locale version are serialized in their respective files. Beacon does not currently differentiate between localizable and non-localizable fields during serialization.

This means:

- Non-localizable fields will appear in every locale-specific file
- If non-localizable fields differ between locale versions (which shouldn't happen in Contentstack), all versions are preserved as-is
- During push operations, Contentstack itself enforces field localization rules

**Rationale**: This approach:

1. Preserves all data exactly as it exists in Contentstack
2. Avoids making assumptions about which fields are localizable (that information comes from the content type schema)
3. Lets Contentstack be the source of truth for localization rules

## References Between Entries/Assets

**Current Status**: References are resolved by UID, which is locale-independent. Each entry has a single UID regardless of how many locale versions exist.

**How it works**:

1. References in entry data point to the UID of the referenced entry/asset (e.g., `blt123456`)
2. UIDs are the same across all locale versions of an entry
3. When Beacon processes references during push operations, it uses the UID to identify the target entry/asset

**Important Consideration**: References do not currently specify which locale version of the target should be used. This is handled by Contentstack's localization rules (typically using fallback locales).

**Implementation**: See [`BeaconReplacer.ts`](../../cli/src/dto/entry/BeaconReplacer.ts) for reference processing.

## Pushing Localized Versions Without Fallback Entry

**What happens**: During push operations, Beacon processes all locale versions for an entry. The implementation handles this as follows:

1. **First locale creation**: When creating a new entry, the first locale version found is used to create the entry in Contentstack ([`buildCreator.ts`](../../cli/src/schema/entries/lib/buildCreator.ts) lines 69-104)

2. **Additional locales**: After the first locale is created, additional locale versions are imported using the entry's UID ([`buildCreator.ts`](../../cli/src/schema/entries/lib/buildCreator.ts) lines 145-172)

3. **Update operations**: For existing entries, all locale versions are imported in parallel ([`toContentstack.ts`](../../cli/src/schema/entries/toContentstack.ts) lines 136-167)

**Can this situation occur?** In theory, no. The filesystem structure ensures that if any locale version exists, at least one locale version will be pushed. However:

- If the first locale version fails to create, the additional locale versions will also fail (they need the UID from the first creation)
- If files are manually manipulated or corrupted, edge cases could theoretically occur

**Safeguards**: The import API calls specify a `locale` parameter, which Contentstack uses to determine whether it's creating/updating a specific locale version vs. the master entry.

## Management API Localization Endpoints

The Contentstack Management API provides these localization endpoints:

- **Localize an Entry**: Creates a new locale version of an entry
- **Update a Localized Entry**: Updates an existing locale version
- **Unlocalize an Entry**: Removes a locale version of an entry

### Are these being used?

**No, Beacon does not use these specific endpoints.** Instead, it uses the **Import API** with locale parameters.

### Why not?

**Reason 1: Import API Covers All Cases**

The Import API (`/v3/content_types/{content_type_uid}/entries/import`) accepts an optional `locale` query parameter:

- When `locale` is specified: Creates/updates that specific locale version
- When `locale` is omitted: Creates/updates the master locale
- The `overwrite` parameter controls create vs. update behavior

This single endpoint handles all our needs:

- Creating new entries (with or without locale)
- Updating existing entries (with or without locale)
- Creating locale versions of existing entries

**Reason 2: Consistency with Import Workflow**

Beacon's design philosophy is to use import/export operations that preserve the exact structure of entries. The Import API:

- Accepts complete entry data (all fields)
- Preserves UIDs (when provided)
- Works consistently for both creation and updates

The specialized localization endpoints (Localize, Update Localized) have different request structures and would require additional code paths without providing additional functionality.

**Reason 3: Simpler Error Handling**

Using a single import endpoint means:

- One error handling path
- Consistent retry logic
- Unified duplicate key detection

**Implementation**: See:

- [`importCreate.ts`](../../cli/src/cs/entries/lib/importCreate.ts) - uses Import API with `locale` parameter
- [`importOverwrite.ts`](../../cli/src/cs/entries/lib/importOverwrite.ts) - uses Import API with `locale` parameter

## Locale Processing Order

**Is the fallback order being enforced?**

**No, the current implementation does not enforce fallback locale ordering.**

**What the documentation says**: When working with localized entries in Contentstack, you should process locales in fallback order:

1. Default/master language first
2. Languages that use the default as fallback
3. Languages that use those as fallbacks, and so on (topological order)

**Current implementation**:

- During **create** operations, locales are processed in the order they appear in the filesystem ([`buildCreator.ts`](../../cli/src/schema/entries/lib/buildCreator.ts) lines 145-172)
- During **update** operations, all locale versions are imported in parallel ([`toContentstack.ts`](../../cli/src/schema/entries/toContentstack.ts) lines 136-167)
- The API endpoint returns locale information including `fallback_locale` ([`getEntryLocales.ts`](../../cli/src/cs/entries/getEntryLocales.ts) line 9), but this is not currently used to order operations

**What happens when order is violated?**

In practice, Contentstack's Import API appears to handle locale versions independently, so processing order may not matter. However, the documentation suggests order is important, so this represents a **potential gap** in the implementation.

**Potential issues**:

- If fallback content is expected to exist before creating a dependent locale, issues could arise
- Validation rules or content inheritance might not work correctly

**Recommendation**: This should be tested with a multi-locale Contentstack instance. If issues are found, the implementation should be updated to:

1. Build a locale dependency graph from the `fallback_locale` field
2. Perform a topological sort
3. Process locales in dependency order

**To track**: Consider adding a TODO or GitHub issue to investigate and implement proper locale ordering.

## Deleting Entries with Localized Versions

**What happens**: When an entry is deleted, all localized versions are automatically deleted.

**Implementation**: The delete operation ([`delete.ts`](../../cli/src/cs/entries/delete.ts)) calls:

```typescript
client.DELETE('/v3/content_types/{content_type_uid}/entries/{entry_uid}', {
  params: { path: { content_type_uid, entry_uid } },
});
```

This deletes the entry identified by `entry_uid`. Since all locale versions share the same UID, they are all deleted together.

**API Note**: The Contentstack API includes a `delete_all_localized` query parameter (see [`cma-openapi-3.d.ts`](../../cli/src/cs/api/cma-openapi-3.d.ts) line 6248), but:

- It defaults to `true` (delete all localized versions)
- Beacon does not explicitly set this parameter (uses the default)
- The behavior is what we want: deleting an entry removes all its locale versions

**Filesystem cleanup**: When an entry is removed during pull operations ([`toFilesystem.ts`](../../cli/src/schema/entries/toFilesystem.ts) lines 130-148):

- All locale-suffixed files matching the entry are deleted
- The base file (if it exists) is also deleted

## Localized Assets

**Current Status**: Assets do not currently have explicit multi-language support in the implementation.

**Why**: Assets in Contentstack are typically locale-independent (e.g., an image file is the same across locales). However, metadata (like title, description) can be localized.

**Observations from API schema**:

- Asset endpoints in the OpenAPI schema don't show locale parameters (unlike entry endpoints)
- The "Create an entry with custom asset field" endpoint exists ([`cma-openapi-3.d.ts`](../../cli/src/cs/api/cma-openapi-3.d.ts) line 1550), but this refers to referencing assets in entries, not localizing the assets themselves

**Current behavior**:

- Assets are pulled/pushed without locale awareness
- Images in Contentstack do not support localization.

---

## Summary

Beacon's multi-language support:

- ✅ Uses filename-based locale identification
- ✅ Maintains backward compatibility with single-locale projects
- ✅ Serializes all field data (including non-localizable fields)
- ✅ Handles references via UIDs (locale-independent)
- ✅ Creates/updates locales using Import API
- ✅ Deletes all locale versions when an entry is deleted
- ⚠️ Does not use specialized Localize/Unlocalize endpoints (by design)
- ⚠️ Does not enforce locale fallback ordering (potential gap)
- ❌ Does not handle localized assets (feature gap)
