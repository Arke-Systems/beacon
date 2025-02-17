# Pull Architecture

The pull command is used to serialize the state of a remote stack into the local
filesystem.

1. Pull data from the remote stack.

   - There are several different kinds of data: assets, taxonomies, content
     types, global fields, and entries.

     - Content Types and Global Fields are the most straightforward. They are
       flat data structures. We can pull them all at once and write them to the
       file system.

     - Taxonomies have a parent/child hierarchy, but the entire dataset can
       still be pulled at once, so we do not need to worry about order
       or references.

     - Assets in Contentstack are either Folders or Files.

       - We do not attempt to synchronize empty folders, or to store metadata
         about folders.

       - Files come in two parts:
         - First is the file's metadata. This includes tags, the file size,
           a description field, and whatever other information Contentstack
           is tracking.
         - Second is a (possibly large) blob of binary data. We do not have a
           way to know whether this blob has changed since the last time it was
           pulled. We rely on the metadata to know if we need to pull the blob
           or not.

     - Entries must be pulled on a per-content type basis. Entries are complex
       because they are permitted to reference other entries, including circular
       references, self-references, and references to entities in other
       content types. The serialization format depends on being able to resolve
       these references.

       Therefore, to serialize any given entity, we must be able resolve a UID
       to another entity's title. We solve this by maintaining a map of _all_
       entities in the stack.

       I do not know if UID values are unique across a stack, but the structure
       of the delivery API suggests they are _not_. Every API call that finds an
       entity by its UID also requires the content type's UID; this suggests
       that a UID alone cannot uniquely identify an entity. Therefore, entities
       are indexed by a composite key of their UID and their content type's UID.

2. Transform the data into the target serialization format.

3. Identify which files have significant changes, and write them to the
   file system.

## Serialized Taxonomy Data Format

Taxonomies are stored in the `taxonomies` folder. The file name is based on
the taxonomy UID, normalized to ensure validity for a file system entry.

We store the name, description, and original uid of the taxonomy. We also
store a list of terms in non-hierarchical order. Each term has a name, a uid,
and a reference to the parent term's uid. If the term is a top-level term, it
will omit the parent term reference.

```yaml
taxonomy:
  description: ''
  name: Event Category
  uid: event_category
terms:
  - name: Workshop
    uid: workshop
  - name: Social Gathering
    uid: social_gathering
  - name: Charity Event
    parent_uid: social_gathering
    uid: charity_event
```

## Serialized Asset Data Format

Assets are stored in the `assets` folder. Serialized assets are split into two
files: one for the metadata and one for the blob.

The filenames always follow these formats:

- `assets/path/in/contentstack/{BaseName}.blob.{Extension}`
- `assets/path/in/contentstack/{BaseName}.meta.{Extension}.yaml`

The metadata file contains the tags, title, and description of the asset:

```yaml
description: The 8th book in the Redwall series.
tags: [skarlath, sunflash]
title: Outcast of Redwall
```

The blob file is simply the blob, binary-equal to the data as it exists in
Contentstack.

## Content Type and Global Field Serialized Data Format

A number of fields are intentionally omitted from Contentstack's original
data structure, as these fields change frequently and are not relevant to
the serialization process:

- `_version`
- `abilities`
- `created_at`
- `DEFAULT_ACL`
- `inbuilt_class`
- `last_activity`
- `maintain_revisions`
- `SYS_ACL`
- `updated_at`

The remaining fields are given a defined and stable sort order, intended to
simplify diffing operations and improve readability.

```yaml
title: Event
uid: event
description: ''
options:
  is_page: false
  singleton: false
  sub_title: []
  title: title
schema: []
```

Individual schema fields are typically serialized as-is from Contentstack's
API, with some exceptions. Namely, fields that reference plugins cannot be
serialized as-is because the plugin is referred to via a UID which changes
from one stack to another. It is therefore necessary to serialize the plugin
reference using a stable value:

```yaml
plugins: [$beacon: { jsonRtePlugin: Bynder }]
```

Fields that reference other global fields or content types do not require any
special handling. Although they reference via UID, these UID values are stable
across stacks.

## Serialized Entry Data Format

Entries are stored in the `entries` folder, in a sub-folder based on their
content type's UID.

The filename is based on the entry's `Title` field, normalized to be a valid
file system entry.

Because it is possible for two entries to have different titles in Contentstack,
but have those two titles serialize to the same normalized value, we generate
unique filenames by applying a stable sort to the entries, then appending a
numeric suffix to the filename.
