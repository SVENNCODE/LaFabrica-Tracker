import { Link } from "react-router-dom";
import { focusRing, muted } from "./ui";

function PlayerCard({ player }) {
  const fullName = `${player.firstName} ${player.lastName}`;

  return (
    <Link
      to={`/Players/${player.id}`}
      className={`flex flex-col rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600 ${focusRing}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700 select-none dark:bg-neutral-900 dark:text-neutral-300">
          {player.firstName?.[0]}
          {player.lastName?.[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold tracking-tight">
            {fullName}
          </h2>
          <p className={`truncate text-sm ${muted}`}>
            {player.currentTeam || "No team"}
          </p>
        </div>
        {player.position && (
          <span className="shrink-0 rounded border border-neutral-200 px-1.5 py-0.5 font-mono text-xs text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
            {player.position}
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-neutral-200 bg-neutral-200 text-center dark:border-neutral-800 dark:bg-neutral-800">
        <Stat label="Goals" value={player.goals} />
        <Stat label="Assists" value={player.assists} />
        <Stat label="Min" value={player.minutesPlayed} />
      </dl>

      <div className={`mt-3 flex justify-between text-xs ${muted}`}>
        <span className="truncate">{player.nationality || "—"}</span>
        {player.age != null && <span>{player.age} yrs</span>}
      </div>
    </Link>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white py-2 dark:bg-neutral-950">
      <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{value ?? "—"}</dd>
    </div>
  );
}

export default PlayerCard;
