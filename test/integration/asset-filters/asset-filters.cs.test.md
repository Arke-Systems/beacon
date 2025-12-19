# Asset Filter Notes

Some notes on how asset filters are supposed to work.

## Inclusion / Exclusion

- An asset is included if any include filter matches it, unless it is excluded.
- An asset is excluded if no include filter matches it.
- An asset is excluded if it matches any of the exclude filters.

Thus, all assets are either included or excluded.

If an excluded item is referenced by any other item, emit a fatal error. This
state cannot be supported because we want to avoid serializing states that
cannot be pushed back. I think only Entry items can reference Asset items;
need to double-check that assumption.

## Push / Pull

### States for Files

| CS      | FS      | Included | Identical | On Push   | On Pull   |
| ------- | ------- | -------- | --------- | --------- | --------- |
| exists  | exists  | true     | true      | no action | no action |
| exists  | exists  | true     | false     | update    | update    |
| exists  | exists  | false    | _any_     | warning   | no action |
| exists  | missing | true     | false     | delete    | create    |
| exists  | missing | false    | false     | no action | no action |
| missing | exists  | true     | false     | create    | delete    |
| missing | exists  | false    | false     | warning   | no action |

### States for Folders

| CS      | FS      | Included | Contains Included | On Push   | On Pull   |
| ------- | ------- | -------- | ----------------- | --------- | --------- |
| exists  | exists  | true     | _any_             | no action | no action |
| exists  | exists  | false    | true              | no action | no action |
| exists  | exists  | false    | false             | warning   | no action |
| exists  | missing | true     | _any_             | delete    | create    |
| exists  | missing | false    | true              | delete    | create    |
| exists  | missing | false    | false             | no action | no action |
| missing | exists  | true     | _any_             | create    | delete    |
| missing | exists  | false    | true              | create    | no action |
| missing | exists  | false    | false             | warning   | no action |

#### v2

- `Included` means the folder is directly marked as included.
- `CS-Child` means at least one child item exists in CS and is included.
- `FS-Child` means at least one child item exists in FS and is included.
- `FS | CS` must be true.
- If `CS` is `false` then `CS-Child` must also be false.
- If `FS` is `false` then `FS-Child` must also be false.

| CS    | FS    | Included | CS-Child | FS-Child | On Push | On Pull |
| ----- | ----- | -------- | -------- | -------- | ------- | ------- |
| true  | true  | true     | true     | true     | skip    | skip    |
| true  | true  | true     | true     | false    | skip    | skip    |
| true  | true  | true     | false    | true     | skip    | skip    |
| true  | true  | true     | false    | false    | skip    | skip    |
| true  | true  | false    | true     | true     | skip    | skip    |
| true  | true  | false    | true     | false    | warn    | skip    |
| true  | true  | false    | false    | true     | skip    | delete  |
| true  | true  | false    | false    | false    | warn    | delete  |
| true  | false | true     | true     | false    | delete  | create  |
| true  | false | true     | false    | false    | delete  | create  |
| true  | false | false    | true     | false    | skip    | create  |
| true  | false | false    | false    | false    | skip    | skip    |
| false | true  | true     | false    | true     | create  | delete  |
| false | true  | true     | false    | false    | create  | delete  |
| false | true  | false    | false    | true     | create  | skip    |
| false | true  | false    | false    | false    | warn    | skip    |

- If an item is directly included, then we do not need to care about the
  children.

- Because git won't commit an empty directory, I think `FS: 1, FS-Child: 0` is
  not likely to occur. But that is a git limitation, not a limitation of the
  file system. We should support it anyway.

#### v3

Feedback is that the current behavior of a `pull` deleting excluded assets
is unexpected and not desired.

These changes are made:

1. If an excluded assets exists in the filesystem **and** the stack, a `pull`
   should take no action. The previous behavior was to delete the file.

2. If an excluded asset exists in the filesystem, but **not** in the stack, a
   `pull` should take no action. The previous behavior was to delete the file.

3. For files, this means an excluded asset will always have `no action`.

4. If an excluded folder exists in the filesystem **and** in the stack, and
   if the folder contains no included items, a `pull` should take no action.
   The previous behavior was to delete the folder and all of its contents.

5. If an excluded folder exists in the filesystem, but **not** in the stack,
   and the folder contains items that should be included, a `pull` should delete
   the contents that are covered by the inclusion filter, but take no action on
   the folder itself, or any of the folder's other contents. The previous
   behavior was to delete the folder and all of its contents.

6. If an excluded folder exists in the filesystem, but **not** in the stack,
   and the folder's contents are also excluded, a `pull` should take no action.
   The previous behavior was to delete the folder and all of its contents.

### Observations

In states where included is true, the state table for folders identical to the
state table for files.

States in which a folder is "missing" yet "Contains Included" are invalid, as
that state means a folder does not exist yet contains items that do exist.
Push/pull operations for these states are N/A.

If we think of push/pull operations as having a source and destination, other
types of transfers are all symmetric. This is not the case once filters are
introduced. For instance, observe how the "exists" and "missing" states are
flipped, but the resulting push/pull outcomes are not:

| CS      | FS      | Included | On Push   | On Pull   |
| ------- | ------- | -------- | --------- | --------- |
| exists  | missing | false    | no action | no action |
| missing | exists  | false    | warning   | no action |

Because of this, we must always distinguish CS and FS, not just source and
destination.

When an asset is excluded (not included), it is effectively unmanaged by Beacon.
During pull operations, excluded assets in the file system are left alone rather
than deleted, even if they don't exist in Contentstack.
