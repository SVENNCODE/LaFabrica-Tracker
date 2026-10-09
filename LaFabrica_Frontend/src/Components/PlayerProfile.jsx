import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { API_URL } from "../config";
import { formatDob } from "../utils/format";
import { container, btnPrimary, panel, muted, focusRing } from "./ui";

function PlayerProfile() {
  const { id } = useParams();
  return <PlayerProfileView key={id} id={id} />;
}

function BackLink() {
  return (
    <Link
      to="/Players"
      className={`inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 ${focusRing}`}
    >
      <FiArrowLeft size={14} aria-hidden="true" />
      Players
    </Link>
  );
}

function PlayerProfileView({ id }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPlayer = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/players/${encodeURIComponent(id)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(
            response.status === 404 || response.status === 400
              ? "Player not found"
              : "Could not load player",
          );
        }
        const data = await response.json();
        setPlayer(data);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(
          err instanceof TypeError ? "Could not reach the server" : err.message,
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchPlayer();
    return () => controller.abort();
  }, [id]);

  const handleScoutReport = async () => {
    setReportLoading(true);
    setReport(null);
    setReportError(null);
    try {
      const response = await fetch(
        `${API_URL}/api/players/${encodeURIComponent(id)}`,
        { method: "POST" },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(data?.error || "Failed to generate report");
      setReport(data);
    } catch (err) {
      setReportError(
        err instanceof TypeError
          ? "Could not reach the server. Please try again."
          : err.message,
      );
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${container} py-10`}>
        <p className={`text-sm ${muted}`} role="status">
          Loading player…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${container} space-y-4 py-10`}>
        <BackLink />
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className={`${container} py-10`}>
      <BackLink />

      <header className="mt-6 flex items-center gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xl font-semibold text-neutral-700 select-none dark:bg-neutral-900 dark:text-neutral-300">
          {player.firstName?.[0]}
          {player.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {player.firstName} {player.lastName}
          </h1>
          <p className={`mt-1 flex flex-wrap items-center gap-x-2 text-sm ${muted}`}>
            {player.position && (
              <span className="rounded border border-neutral-200 px-1.5 py-0.5 font-mono text-xs text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                {player.position}
              </span>
            )}
            {player.currentTeam && <span>{player.currentTeam}</span>}
            {player.nationality && <span>{player.nationality}</span>}
            {player.age != null && <span>{player.age} years old</span>}
          </p>
        </div>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-800">
        <Summary label="Goals" value={player.goals} />
        <Summary label="Assists" value={player.assists} />
        <Summary label="Minutes" value={player.minutesPlayed} />
        <Summary label="Goals / 90" value={player.goalsPer90} />
      </dl>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <section aria-labelledby="physical">
          <h2 id="physical" className="text-sm font-semibold tracking-tight">
            Physical attributes
          </h2>
          <dl className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            <Row
              label="Height"
              value={player.Height ? `${player.Height} cm` : "—"}
            />
            <Row label="Preferred foot" value={player.preferredFoot ?? "—"} />
            <Row label="Date of birth" value={formatDob(player.dateofBirth)} />
          </dl>
        </section>

        <section aria-labelledby="stats">
          <h2 id="stats" className="text-sm font-semibold tracking-tight">
            Performance
          </h2>
          <dl className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            <Row label="Goals" value={player.goals ?? "—"} />
            <Row label="Assists" value={player.assists ?? "—"} />
            <Row
              label="Minutes played"
              value={
                player.minutesPlayed ? `${player.minutesPlayed} min` : "—"
              }
            />
            <Row label="Goals per 90" value={player.goalsPer90 ?? "—"} />
            <Row label="Assists per 90" value={player.assistsPer90 ?? "—"} />
          </dl>
          {player.goalsPer90 == null && (
            <p className={`mt-2 text-xs ${muted}`}>
              Per-90 figures need more than 180 minutes played.
            </p>
          )}
        </section>
      </div>

      <section
        aria-labelledby="scout"
        className={`mt-8 p-6 ${panel}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="scout" className="text-sm font-semibold tracking-tight">
              Scout report
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              AI-generated projection and comparison from this player's data.
            </p>
          </div>
          {!report && (
            <button
              type="button"
              onClick={handleScoutReport}
              disabled={reportLoading}
              className={btnPrimary}
            >
              {reportLoading ? "Generating…" : "Generate report"}
            </button>
          )}
        </div>

        {reportLoading && (
          <p className={`mt-4 text-sm ${muted}`} role="status">
            Analyzing player data…
          </p>
        )}
        {reportError && (
          <p
            className="mt-4 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {reportError}
          </p>
        )}
        {report && (
          <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <span className="inline-block rounded border border-neutral-200 px-1.5 py-0.5 text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
              AI-generated
            </span>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
              {report.report}
            </p>
            <p className={`mt-4 text-xs ${muted}`}>
              Written by an AI model from the data on this page only, so it can
              contain mistakes and is not verified scouting information.
              {report.generatedAt &&
                ` Generated ${new Date(report.generatedAt).toLocaleDateString()}.`}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="bg-white p-4 dark:bg-neutral-950">
      <dt className={`text-xs ${muted}`}>{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {value ?? "—"}
      </dd>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 text-sm">
      <dt className={muted}>{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export default PlayerProfile;
