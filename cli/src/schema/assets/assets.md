# Dev Notes: Assets

Q: Can I create a folder with a specific UID?
A: No. There is a "Create Folder" endpoint but it does not accept a UID.

As a result, UID values will be different for every stack.

We must therefore match on name and not UID.

This presents a difficulty because Contentstack allows duplicate names for
both folders and files. This introduces ambiguity. Probably manageable with
warnings and errors.

Q: Can I create a folder using characters that are invalid in either Windows,
Linux, or MacOS?

A: No, an error message is returned:

> Folder name can contain only alphanumeric characters ('A-Z', 'a-z', '0-9'),
> hyphens ('-'), and/or underscores ('\_').`

Therefore, folder names can map directly to file system names. Also, the
documentation specifies that folder names may only nest five levels deep,
so I think it will be ok to use the folder name as the path.

Q: Can I create an asset and specify the UID?
A: No, there is no API that allows this.

We will need to match on names again.

## Plan

We can compare folder names with folder names present in the file system.

Content types, entries, and RTE assets may all reference assets by UID.

When we pull, when a reference to an Asset via UID is found, we must serialize
it as a reference to the title / filename.

We must issue errors for duplicate names.

## File System Serialization

Each asset is going to have two files: one for the metadata and one for
the binary.

Our serialization should be informed by the API used to create asset folders
and files.

The [Create Folder][1] API accepts this body:

```json
{
  "asset": {
    "name": "asset_folder_name",
    "parent_uid": "asset_parent_folder_uid"
  }
}
```

There is an [Upload Asset][2] and a [Replace Asset][3] endpoint.

Uploading and Replacing both accept _only_ these parameters:

- `parent_uid` - Folder UID
- `title`
- `description`
- `tags`

Therefore, our serialization must contain _at least_ these fields.
Except for `parent_uid`. We cannot trust the UIDs because we have no way
to set them, so they will be different in every stack. Also, we shouldn't
serialize them at all, because they will be derived from the name of the
parent folder in the file system.

### Thoughts about how these get named:

- The sidecar and the blob need to sort together.

- The blob's extension must be the "real" extension. This is to support tooling
  that wishes to display the contents; i.e., doing a PR review and wanting to
  see images.

- The sidecar's extension must be YAML for a similar reason.

- The blob's name should start with the actual name as reported by Contentstack.
  I've already verified that Contentstack only permits valid characters in
  the name.

- Contentstack permits duplicate file names but I don't see an easy way to
  support that. If we generate a requirement that file names must be unique, our
  serialization problem becomes much easier to solve.

- Therefore, the first naming solution is that the blob name should be as-is,
  and the sidecar name should use the blob's name (including extension) with an
  additional `.yaml` extension after it.

- This introduces a possible ambiguity because it is possible for a blob to be
  named such that it conflicts with a different blob's sidecar.
  - I've considered separating the two into different directories but I reject
    that because it makes PR reviews harder.

  - I've considered attempting to use alternate data streams to tie the sidecar
    directly to the file at a filesystem level but I reject that because Git
    does not support it.

  - I've considered a naming scheme that avoids the problem:
    - I could use the Contentstack UID in the name. I reject this because the
      UID is not human-readable, and because it changes on a per-developer
      basis. It would only ever make sense for the dev who first serializes the
      asset, then it is useless to everyone else.

    - I could apply a prefix to both the blob and the sidecar file names:
      - A simple prefix (like `asset-` or `metadata-`) would suffice, but I
        reject that because it means the files no longer sort together.

      - A hash of the file contents would be unique and would sort together, but
        then we can no longer alpha-sort the files. It becomes much harder to
        compare the source control contents with what remains in Contentstack.

      - Oh, hey, I could just apply a suffix to both files. That would work.
        Wish I could think of obvious solutions without going the long
        way around.

- So the final naming pattern is:
  - Blob: `original-blob-name.blob.original-blob-extension`
  - Sidecar: `original-blob-name.meta.original-blob-extension.yaml`

## Change Detection

See [Asset Modification Detection][6].

[1]: https://www.contentstack.com/docs/developers/apis/content-management-api#create-a-folder 'Create a Folder'
[2]: https://www.contentstack.com/docs/developers/apis/content-management-api#upload-asset 'Upload Asset'
[3]: https://www.contentstack.com/docs/developers/apis/content-management-api#replace-asset 'Replace Asset'
[4]: https://www.contentstack.com/docs/developers/apis/content-management-api#delete-asset 'Delete Asset'
[5]: https://www.contentstack.com/docs/developers/apis/content-management-api#get-all-assets 'Get All Assets'
[6]: ../../../../doc/lessons-learned/asset-modification-detection.md 'Asset Modification Detection'
