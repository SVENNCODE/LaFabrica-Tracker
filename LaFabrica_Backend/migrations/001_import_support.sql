ALTER TABLE players ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE players ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE players SET "Height" = NULL WHERE "Height" = 0;

UPDATE players SET "preferredFoot" = initcap(lower(btrim("preferredFoot")))
 WHERE "preferredFoot" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS players_identity_key
    ON players (lower("firstName"), lower("lastName"), "dateofBirth");
