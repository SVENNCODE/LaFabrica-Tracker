import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PlayerCard from "./PlayerCard";
import { API_URL } from "../config";
import { container, focusRing, muted } from "./ui";

const POSITION_PILLS = ["GK", "DEF", "MID", "FWD"];
const SORT_OPTIONS = [
  ["name_asc", "Name A–Z"],
  ["name_desc", "Name Z–A"],
  ["age_asc", "Youngest first"],
  ["age_desc", "Oldest first"],
  ["goals_desc", "Most goals"],
  ["assists_desc", "Most assists"],
  ["minutes_desc", "Most minutes"],
];

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 rounded-md border px-3 text-sm font-medium transition-colors ${focusRing} ${
        active
          ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
      }`}
    >
      {children}
    </button>
  );
}

function FilterRow({ label, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <label htmlFor={htmlFor} className={`w-20 shrink-0 text-sm ${muted}`}>
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Players() {
  const [searchParams, setSearchParams] = useSearchParams();
  const position = searchParams.get("position") || "";
  const team = searchParams.get("team") || "";
  const sort = searchParams.get("sort") || "name_asc";

  const query = new URLSearchParams();
  if (position) query.set("position", position);
  if (team) query.set("team", team);
  if (sort !== "name_asc") query.set("sort", sort);
  const queryString = query.toString();

  const [result, setResult] = useState({
    queryString: null,
    players: [],
    error: null,
  });
  const [teams, setTeams] = useState([]);
  const loading = result.queryString !== queryString;
  const firstLoad = result.queryString === null;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/players${queryString ? `?${queryString}` : ""}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok)
          throw new Error(body?.error || "Failed to fetch players");
        return body;
      })
      .then((data) => setResult({ queryString, players: data, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResult({
          queryString,
          players: [],
          error:
            err instanceof TypeError
              ? "Could not reach the server"
              : err.message,
        });
      });
    return () => controller.abort();
  }, [queryString]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/players/filters`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data && Array.isArray(data.teams) && setTeams(data.teams))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  const clearFilters = () =>
    setSearchParams(sort !== "name_asc" ? { sort } : {}, { replace: true });
  const filtered = Boolean(position || team);

  if (firstLoad) {
    return (
      <div className={`${container} py-16`}>
        <p className={`text-sm ${muted}`} role="status">
          Loading players…
        </p>
      </div>
    );
  }

  const { players, error } = result;

  return (
    <div className={`${container} py-10`}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Players</h1>
        <p className={`text-sm ${muted}`} aria-live="polite">
          {error
            ? "Could not load players"
            : `${players.length} player${players.length === 1 ? "" : "s"} ${filtered ? "match" : "in the academy"}`}
        </p>
      </div>

      <div className="mt-6 space-y-3 border-y border-neutral-200 py-4 dark:border-neutral-800">
        <FilterRow label="Position">
          <Pill active={!position} onClick={() => setParam("position", "")}>
            All
          </Pill>
          {POSITION_PILLS.map((p) => (
            <Pill
              key={p}
              active={position.toUpperCase() === p}
              onClick={() => setParam("position", p)}
            >
              {p}
            </Pill>
          ))}
        </FilterRow>

        {teams.length > 0 && (
          <FilterRow label="Team">
            <Pill active={!team} onClick={() => setParam("team", "")}>
              All
            </Pill>
            {teams.map((t) => (
              <Pill
                key={t}
                active={team.toLowerCase() === t.toLowerCase()}
                onClick={() => setParam("team", t)}
              >
                {t}
              </Pill>
            ))}
          </FilterRow>
        )}

        <FilterRow label="Sort by" htmlFor="sort">
          <select
            id="sort"
            value={SORT_OPTIONS.some(([v]) => v === sort) ? sort : "name_asc"}
            onChange={(e) =>
              setParam(
                "sort",
                e.target.value === "name_asc" ? "" : e.target.value,
              )
            }
            className={`h-8 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 ${focusRing}`}
          >
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {filtered && (
            <button
              type="button"
              onClick={clearFilters}
              className={`h-8 rounded-md px-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 ${focusRing}`}
            >
              Clear filters
            </button>
          )}
        </FilterRow>
      </div>

      {error && (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!error && players.length === 0 && !loading && (
        <p className={`mt-6 text-sm ${muted}`}>
          No players match these filters.
        </p>
      )}

      <div
        className={`mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${loading ? "opacity-50" : ""}`}
      >
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}

export default Players;
