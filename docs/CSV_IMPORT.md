# Importing players from a CSV

## One-time setup

1. `cd LaFabrica_Backend && npm install` (adds `multer`, `csv-parse`, `express-rate-limit`).
2. Add a long random value to `LaFabrica_Backend/.env`:
   `ADMIN_API_KEY=<random string>`. If this is not set, the admin API is **disabled**, not open.
3. `npm run migrate`. Applies every file in `LaFabrica_Backend/migrations/` that has not run yet:
   `000` creates the `players` table if it does not exist, `001` adds `created_at`/`updated_at`, fixes
   `preferredFoot` casing and zero heights, and creates the unique key on first name + last name + date of
   birth, `002` adds the stored scout reports table, and `003` makes first name, last name and date of
   birth required. A migration that cannot apply stops with an error and changes nothing.
4. Start the API and the frontend as usual, then open `http://localhost:5173/admin/import`.
   The page is not linked from the navbar.

## Using it

1. Enter the admin key, choose a `.csv` file. A preview runs automatically and saves nothing.
2. Review: new / updated / unchanged / error rows, with before → after values for every update.
3. Press **Import**. If any row has an error, nothing is saved.

Download `players_template.csv` from the page for the exact columns.

## Rules

| Cell                         | Effect                                         |
| ---------------------------- | ---------------------------------------------- |
| value                        | sets the field                                 |
| blank                        | leaves the existing value alone                |
| `<clear>`                    | sets the field to empty (optional fields only) |
| column missing from the file | leaves that field alone                        |

- Required: `firstName`, `lastName`, `dateofBirth` (`YYYY-MM-DD`). Together they identify a player
  (case-insensitive): a match is updated, otherwise a player is added.
- Optional: `nationality`, `position` (GK CB RB LB CDM CM CAM RM LM RW LW CF ST), `currentTeam`,
  `Height` (100–230 cm), `preferredFoot` (Left/Right/Both), `goals`, `assists` (0–999), `minutesPlayed` (0–20000).
- Limits: 1 MB and 5,000 rows per file. Comma, semicolon or tab separated; UTF-8 or Windows-1252 (Excel).

## API

```
curl -X POST "http://localhost:3000/api/admin/players/import"                 \
     -H "x-admin-key: $ADMIN_API_KEY" -F "file=@players.csv"                  # dry run (default)
curl -X POST "http://localhost:3000/api/admin/players/import?dryRun=false"    \
     -H "x-admin-key: $ADMIN_API_KEY" -F "file=@players.csv"                  # real import
```

Writing requires the explicit `dryRun=false`. Rate limit: 60 admin requests per 15 minutes per IP.

## Tests

The tests run against a real Postgres and delete all players, so they refuse to run unless the database
name (`DB_NAME`, or the database in `DATABASE_URL`) ends in `_test`. Create that database, migrate it, then run:

```
DB_NAME=lafabrica_test DB_USER=... DB_HOST=localhost DB_PASSWORD=... npm run migrate
DB_NAME=lafabrica_test DB_USER=... DB_HOST=localhost DB_PASSWORD=... npm test
```

This runs the importer tests and the player API / scout report / rate-limit tests (one file at a time,
because they share the one test database).
