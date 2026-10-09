-- One current report per player.

CREATE TABLE IF NOT EXISTS scout_reports (
    player_id  integer PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    report     text        NOT NULL,
    model      text        NOT NULL,
    input_hash text        NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
