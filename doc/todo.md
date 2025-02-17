# Beacon TODO

## Provide an "outputs" section

There are times when we depend on specific UID values as they exist in the
target stack. For instance, the "Site Settings" single entry's UID is placed
into an environment variable for later consumption. Beacon should have a means
of outputting such values are a sync.

- This implies we will need a way to define which entries get output. That sort
  of configuration goes beyond what I would want to manage with environment
  variables. Considering adding support for a configuration file first.

## Change sort order for serialized entries

Now that we have to parse content types anyway, we could sort entry properties
when serializing to match the order of fields defined by the content type.

## Be more conservative about pushing invalid entries

We've run into at least one case in which a change to a content type schema
was committed without making associated commits to affected entries. This
resulted in attempting to push entries that have an invalid schema.

Contentstack is surprising fine about this, but we shouldn't be: this is an
error scenario and we should have refused to push the entries.

## Find a way to automatically locate extension UID values by name

There is an API for this but it only returns an empty array... ??? What am I
doing wrong?

## Date fields

I have observed that CS will provide dates as either:

```yaml
end_date: '2024-11-22T21:09:51Z'
```

or:

```yaml
end_date: '2024-11-22T21:09:51.000Z'
```

These meant to represent the same date, but because we are performing string
equality testing, they count as different.
