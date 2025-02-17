# Lessons Learned: Contentstack CLI

Contentstack provides a [CLI][1] utility that provides out-of-the-box
functionality to synchronize content between stacks, including assets,
entities, content types, and global fields.

This possiblity was initially explored, then rejected for these reasons:

- It requires regular authentication and appears to be difficult to integrate
  with our `.env` file. It is possible to add a management token manually, but
  this token is shared machine-wide and is not specific to a project. It is
  possible to give that token a project-specific alias, but then you have to
  refer to the alias for every command, which complicates scripting.

- The CLI does not handle deletions in either synchronization direction.

- It serializes as minified JSON, which is not helpful if we are trying to
  do code review on schema changes.

- It operates in two modes: complete and per-module. The "complete" mode
  synchronizes _everything_, which works, but includes a lot of data that we
  do not want and will potentially break in higher environments. We do not
  currently expect that developers will be synchronizing all entites with
  the entities in dev / qa / prod, for instance.

  The "per-module" mode lets us be more picky about what gets synchronized,
  but still causes complicates for entites (_all_ entries are a single module,
  so that is still all-or-nothing). Also, per-module mode is finicky and the
  modules must be handled in a specific order, with a specific context (meaning
  it is necessary to start a synchronization operation, import each module,
  then close the operation). This is workable but complicated.

- It generates a lot of noise in the repository, where it insists on keeping
  a variety of log files and backups. I have attempted to provide it with a
  specific location for this data, but it generates errors when I do so.

- When it exports data, it does _not_ generate stable file names for assets or
  entities. This is a deal-breaker if we want to commit the exported data to
  source control. I observed different, randomized filenames being generated
  from two exports run back-to-back.

[1]: https://www.contentstack.com/docs/developers/cli 'Contentstack CLI'
