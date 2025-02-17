# Asset Modification Detection

At present, we are trying to detect asset modifications by comparing the ETag
values. This is not working out.

Asset ETag value are not stable across stacks and cannot be trusted. Not all
assets produce ETags anyway. We need to find another way to compare files for
differences.

## Considerations

### File Hash

We would have to download the entire blob from Contentstack before we could
calculate a hash.

I see that when we use the "Get Asset" API, we have the option to also get
any metadata associated with the asset. By default, this includes nothing.

If we could _write_ to this metadata, when we could calculate the hash and
store it alongside the file in Contentstack. That would give us a way to
get the hash back again without needing to re-download the blob.

I have trouble finding a way to write to this metadata. It looks like it is
grouped by an extension UID. Creating an extension is non-trivial. Managing
installed extensions on a stack is also non-trivial. Extension UIDs refer to
the UID of the extension as it is installed on a target stack, so they are
not stable from one stack to another anyway.

Also, it would require users to install an extension on their stacks. That means
we have to _HOST_ the extension somewhere. It might be possible to "host" the
extension locally; i.e., have Beacon spin up a server and have the UI hooks
all point to localhost. I _think_ it only needs to be running during the
initial installation process.

About the initial installation process: it is possible to automate this (we do
so on Pathfinder for integration tests), but it needs more permissions than it
is possible to get from a Management API token. The user would have to type in
their username / password. And also manage multi-factor authentication. What a
pain.

Leaving aside the hosting / installation issues, the general idea of using an
extension's metadata to track a hash still sounds promising. I'm just worried
about the level of effort.

### Last Modified Date

Assets in the file system have a "Last Modified" timestamp. Assets in
Contentstack have a "Last Modified" timestamp. These cannot be used, for
these reasons:

1. The "Last Modified" timestamp in the file system is local to the developer's
   machine. Git will not track or update this timestamp, so it is going to
   reflect the last time the file was modified on a single user's machine.
   That's most likely to be the last time the file was pulled by Git, which
   is not the same as the last time the file was actually modified.

2. Similarly, the "Last Modified" timestamp in Contentstack is the last time the
   asset was modified in the target stack. This has the same problems: it's
   an indication of the most recent push that modified the file, nothing more.
   That's again not the same thing as the last time the file was actually
   modified.

However, we could track our own "Last Modified" date in the asset metadata.

When we see a brand new asset file during a push, we could store the
Contentstack's "Last Modified" date in the asset metadata.

The developer commits this file to source control. That solves the problem of
the file system's last-modified date being unstable across developers.

Sadly, I don't see a way to solve the second problem. We still can't trust the
last-modified date in Contentstack and we have no way to store our own. Mostly.
I reject the idea of stuffing it into the tags or description, and if we wanted
to go through the effort of putting it into the metadata then we would just use
the hash instead.

### File Size

There _is_ a file size field available, and it is stable across stacks. We could
just compare the file size for equality.

I don't like this idea very much because it is such a weak comparison. It is too
easy to imagine cases in which the file has mutated without causing a change in
the file size. We could mitigate this using a new CLI flag: `--force-assets`
or similar.

### ETag

**This section is outdated**. It represents the thinking that went into the
attempt to use ETags to detect asset modifications. It is recorded here as a
lesson learned, not as a current plan.

The response from the "Get Asset" APIs contain a URL, and that URL provides an
`ETag` header. As of 2024-10-01, Contentstack honors the `ETag` by returning a
`304: Not Modified` response if the URL is fetched with an `If-None-Match`
header that provides a previously seen `ETag`.

This increases the number of requests we need to make to index the Contentstack
assets: one request to get the index, then one request per asset to see if the
asset has changed or not. Fortunately, we can rely on the 304 header to avoid
actually downloading the entire asset.

On 2024-10-03, I noted that the `ETag` values from Contentstack "look funny"
in that they are enclosed in double quotes. For instance, the ETag literal
is `"UMCfgQpLHbErOa5LM1cdhCC+qn1mlLVl2lx6fvAj0zs"`, including the quotes.
While this looks strange to my eyes, it is still a valid ETag, and I confirmed
that Contentstack returns the expected 304 Not Modified header when presented
with the ETag in this format.

I've considered and rejected two methods that might avoid this
per-asset request:

First, we could calculate a checksum ourselves and store is in the asset's tag
list. I reject this because I think tags are used for searching, and I don't
want to clutter the search index.

Second, there is a dedicated metadata API that could be used to attach
arbitrary metadata to assets. I reject this as well due to complication: the
metadata API requires an extension UID, and nothing else about beacon requires
it to be an actual extension in Contentstack. Extensions have to be installed
by the user. It sounds like a lot of pain.

#### Getting the ETag

I'm thinking about how to get the etag for the item as it currently exists in
Contentstack. We may or may not have the etag for the item from the last time it
was pulled. If we don't have the previous etag, or if the previous etag doesn't
match, then the process of getting the current etag is also going to download
the entire binary asset.

Do we download this into a temporary location, then move it into position during
the transfer process? Or do we download it directly into the file system into
its final location?

#### Temporary Location

- Pro: This specific function does not need knowledge of how the rest of the
  system is structured. Complexity is isolated.

- Pro: If the transfer process fails, the original file is left untouched.
  Failure cases are easier to handle.

- Con: /Something/ must happen to the file before the program exits. If it is
  not used, it must be removed. Cleanup is required.

#### Final Location

- Pro: The file is in its final location. No additional steps are required to
  complete the transfer.

- Con: The existing transfer process is not made to support this.

- Con: Hard to handle multiple executions. Would we need some sort of locking
  behavior? How long do transfers take?

Going with a temporary location for now.

## Conclusion

Even though I don't like the file size comparison, it is the best option
we have.
