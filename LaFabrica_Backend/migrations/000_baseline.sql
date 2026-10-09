CREATE TABLE IF NOT EXISTS players (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "firstName" character varying(255),
    "lastName" character varying(255),
    "dateofBirth" date,
    nationality character varying(255),
    "position" character varying(5),
    "currentTeam" character varying(255),
    "Height" integer,
    "preferredFoot" character varying,
    goals integer,
    assists integer,
    "minutesPlayed" integer
);
