# Player data files

Player ids are assigned as `file base + array index` by `lib/data.ts`. Share
links encode those ids, so:

- **Append only.** Never reorder, insert, or delete entries in these files.
- New players go at the end of their file; new files get a fresh base in the
  `lib/data.ts` manifest (bases step by 500, one file must stay under 500 entries).
- To "remove" a player, leave the entry in place (it can be soft-hidden in code).

Every club × decade pool must keep ≥1 GK, ≥4 DF, ≥5 MF, ≥4 FW (enforced by
`npm run validate-data`) so no spin can ever dead-end. Prefer 2 GKs when the
backup is a real, verifiable name — never invent players to hit a minimum.
