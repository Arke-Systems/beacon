# Contentstack and Circular References

## In Content Types

When inserting into Contentstack, content types that contain a reference to
another content type require the referenced content type to already exist.
Otherwise, the following error is returned:

```plaintext
Error Code 115: There was a problem importing the Content Type. Please correct
the Content Type and try again.

Details: {
  'site_header.reference_to': [
    'site_header refers to a Content Type that does not exist.'
  ]
}
```

We could order the content types such that the referenced content type is
created first. I have rejected this approach because it fails to handle circular
references, which are legal to create within Contentstack.

It is also challenging to locate all references within a content type's schema,
and doing so successfully requires a deeper knowledge of how Contentstack
serializes schemas than this program otherwise requires.

Instead, I have opted to handle a push operation using the following algorithm:

1. Handle all deletions first.

2. Create all content types but with a minimal schema. Just the `title` field
   and nothing else. This should ensure that all content types exist prior to
   any references.

3. Make a second pass over all created content types and populate their
   actual schemas.

4. Handle all mutations.

## In Global Fields

Because global fields may contain references to content types, and because
content types may likewise contain references to global fields, the same
sort of issue exists.

To resolve this, I have separated the handling of the content type shims from
the rest of the content type code, so that we may push changes to Contentstack
in this order: `Content Type Shims` > `Global Fields` > `Content Types`.

## In Entries

A similar problem exists for entries, which may reference themselves or each
other through reference fields.

A complication is introduced because the UID value for entries is not stable
across stacks. Any exported entry contains references to UID values that exist
in the stack from which it was exported, but those UID values will not exist
in the target stack. We must [match entries on the title][1] instead. This is
challenging because the title is not present in the exported JSON.

The solution is:

1. When exporting an entry, use the content type's schema to locate any
   reference fields.

2. For each reference field, replace the corresponding section of the exported
   data with an object that describes the title of the entry being referenced:

   ```yaml
   // Before
   reference_field:
     _content_type_uid: reference_content_type_uid
     uid: --some-unstable-uid--

   // After
   reference_field:
     $beacon: entr
       entry: reference_content_type_uid/--the-entry-title--
   ```

3. When importing an entry, locate all instances of `$beacon` as a property
   value and process them accordingly. In this case, if the `$beacon` object
   contains an `entry` property, the `$beacon` object should be replaced with
   a reference object as it would be understood by Contentstack.

4. This replacement is also challenging because it depends on knowing the UID
   values for the referenced entries as they exist in the target stack. This
   information can only be known after a successful import of the referenced
   entries. This faces the same issues with circular- and self-referential
   entries as we face with content types, and a similar two-pass strategy can
   be used to solve it.

   However, only the _second_ pass can provide the correct UID values, while
   the _first_ pass still needs a replacement value. Therefore, the first pass
   uses placeholder values for the UIDs, and the second pass modifies the
   affected entries to use the correct UID values.

   An optimization can be made: it is probable that the first pass _might_ be
   able to generate the correct UID values, if the referenced entries have
   already been imported.

   Therefore, the first-pass replacement algorithm is:

   - Given the a content type and title, attempt to locate a matching entry
     among the entries that have already been imported.

   - If a match is found, use the UID value of the matching entry.

   - Otherwise, use a placeholder value and record the entry for a second pass.

   And the second-pass replacement algorithm is:

   - Given the a content type and title, locate the matching entry among
     imported entries.

   - If a match is not found, throw an error.

   - Otherwise, update the placeholder value with the correct UID value.

[1]: ./working-with-entries.md 'Working with Entries'
