import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config";
import {
  container,
  btnPrimary,
  btnSecondary,
  textInput,
  panel,
  muted,
  focusRing,
} from "./ui";

const MAX_BYTES = 1024 * 1024;
const MAX_ROWS_SHOWN = 200;

const STATUS_DOT = {
  insert: "bg-emerald-500",
  update: "bg-amber-500",
  unchanged: "bg-neutral-400",
  invalid: "bg-red-500",
};
const STATUS_LABELS = {
  insert: "New",
  update: "Update",
  unchanged: "No change",
  invalid: "Error",
};

const show = (v) => (v === null || v === undefined ? "empty" : String(v));

function AdminImport() {
  const [adminKey, setAdminKey] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const send = async (f, dryRun) => {
    const form = new FormData();
    form.append("file", f);
    const response = await fetch(
      `${API_URL}/api/admin/players/import?dryRun=${dryRun}`,
      {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: form,
      },
    );
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { status: response.status, body };
  };

  const runPreview = async (f) => {
    setError(null);
    setPreview(null);
    if (!adminKey) {
      setError("Enter the admin key, then press Preview.");
      return;
    }
    setBusy("preview");
    try {
      const { status, body } = await send(f, true);
      if (status === 200 && body?.summary) setPreview(body);
      else setError(body?.error || `Preview failed (HTTP ${status}).`);
    } catch {
      setError(
        "Could not reach the server. Is the API running and is the file still available?",
      );
    } finally {
      setBusy(null);
    }
  };

  const chooseFile = (f) => {
    setDone(null);
    setPreview(null);
    setError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!/\.csv$/i.test(f.name)) {
      setFile(null);
      setError("Only .csv files are accepted.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setFile(null);
      setError("That file is over 1 MB.");
      return;
    }
    setFile(f);
    if (adminKey) runPreview(f);
  };

  const runImport = async () => {
    setError(null);
    setBusy("import");
    try {
      const { status, body } = await send(file, false);
      if (status === 200 && body?.applied) {
        setDone(body);
        setPreview(null);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
      } else if (status === 422 && body?.summary) {
        setPreview(body);
        setError(
          "Nothing was imported because the file has errors. Fix them and try again.",
        );
      } else {
        setError(
          body?.error || `Import failed (HTTP ${status}). Nothing was saved.`,
        );
      }
    } catch {
      setError("Could not reach the server. Nothing was saved.");
    } finally {
      setBusy(null);
    }
  };

  const summary = preview?.summary;
  const canImport =
    preview &&
    !busy &&
    summary.invalid === 0 &&
    summary.insert + summary.update > 0;
  const rows = preview
    ? preview.rows.filter((r) => showUnchanged || r.status !== "unchanged")
    : [];

  return (
    <div className={`${container} py-10`}>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Import players
          </h1>
          <p className={`mt-1 text-sm ${muted}`}>
            Add new players or update existing ones from a CSV file.
          </p>
        </div>

        <section className="space-y-6">
          <div>
            <label
              htmlFor="admin-key"
              className="mb-1.5 block text-sm font-medium"
            >
              Admin key
            </label>
            <input
              id="admin-key"
              type="password"
              autoComplete="off"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className={`${textInput} max-w-sm`}
              placeholder="ADMIN_API_KEY from the server .env"
            />
            <p className={`mt-1.5 text-xs ${muted}`}>
              Kept in this page only, never stored in the browser.
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              chooseFile(e.dataTransfer.files?.[0]);
            }}
            className={`rounded-lg border border-dashed p-8 text-center transition-colors ${
              dragging
                ? "border-blue-600 dark:border-blue-500"
                : "border-neutral-300 dark:border-neutral-700"
            }`}
          >
            <p className={`text-sm ${muted}`}>Drop a .csv file here, or</p>
            <label className={`${btnPrimary} mt-3 cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-600`}>
              Choose file
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => chooseFile(e.target.files?.[0])}
              />
            </label>
            {file && (
              <p className="mt-3 text-sm">
                <span className="font-medium">{file.name}</span>
                <span className={muted}>
                  {" "}
                  · {Math.max(1, Math.round(file.size / 1024))} KB
                </span>
              </p>
            )}
            <p className="mt-3 text-sm">
              <a
                href="/players_template.csv"
                download
                className={`rounded-md font-medium text-blue-600 hover:underline dark:text-blue-500 ${focusRing}`}
              >
                Download the CSV template
              </a>
            </p>
          </div>

          {file && (
            <button
              type="button"
              onClick={() => runPreview(file)}
              disabled={busy !== null}
              className={btnSecondary}
            >
              {busy === "preview" ? "Checking…" : "Preview import"}
            </button>
          )}
        </section>

        <div aria-live="polite">
          {error && (
            <div
              className="rounded-lg border border-red-200 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        {done && (
          <div className={`p-6 ${panel}`}>
            <h2 className="text-sm font-semibold tracking-tight">
              Import complete
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              {done.summary.insert} new, {done.summary.update} updated,{" "}
              {done.summary.unchanged} unchanged.
            </p>
            <Link
              to="/Players"
              className={`mt-3 inline-block rounded-md text-sm font-medium text-blue-600 hover:underline dark:text-blue-500 ${focusRing}`}
            >
              View players
            </Link>
          </div>
        )}

        {preview && (
          <section className="space-y-6 border-t border-neutral-200 pt-8 dark:border-neutral-800">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-800">
              {["insert", "update", "unchanged", "invalid"].map((s) => (
                <div key={s} className="bg-white p-4 dark:bg-neutral-950">
                  <dt className={`flex items-center gap-2 text-xs ${muted}`}>
                    <span
                      className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`}
                      aria-hidden="true"
                    />
                    {STATUS_LABELS[s]}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                    {summary[s]}
                  </dd>
                </div>
              ))}
            </dl>

            {preview.ignoredColumns?.length > 0 && (
              <p className={`text-sm ${muted}`}>
                Ignored columns (not recognised):{" "}
                {preview.ignoredColumns.join(", ")}
              </p>
            )}
            {preview.encoding === "windows-1252" && (
              <p className={`text-sm ${muted}`}>This file was not UTF-8</p>
            )}

            {preview.errors.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-red-700 dark:text-red-400">
                  Fix before importing
                </h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b border-neutral-200 text-left text-xs dark:border-neutral-800 ${muted}`}>
                        <th className="py-2 pr-4 font-medium">Row</th>
                        <th className="py-2 pr-4 font-medium">Column</th>
                        <th className="py-2 font-medium">Problem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {preview.errors.slice(0, 100).map((e, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-4 font-mono tabular-nums">
                            {e.row}
                          </td>
                          <td className="py-2 pr-4">{e.field ?? "—"}</td>
                          <td className="py-2 text-red-700 dark:text-red-400">
                            {e.field
                              ? `${e.field} ${e.message}`
                              : `Row ${e.message}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.errors.length > 100 && (
                  <p className={`mt-2 text-xs ${muted}`}>
                    Showing the first 100 of {preview.errors.length} problems.
                  </p>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold tracking-tight">
                  What will change
                </h2>
                <label className={`flex items-center gap-2 text-sm ${muted}`}>
                  <input
                    type="checkbox"
                    checked={showUnchanged}
                    onChange={(e) => setShowUnchanged(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Show unchanged rows
                </label>
              </div>
              {rows.length === 0 ? (
                <p className={`mt-3 text-sm ${muted}`}>Nothing to show.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b border-neutral-200 text-left text-xs dark:border-neutral-800 ${muted}`}>
                        <th className="py-2 pr-4 font-medium">Row</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 font-medium">Player</th>
                        <th className="py-2 font-medium">Changes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {rows.slice(0, MAX_ROWS_SHOWN).map((r) => (
                        <tr key={r.row} className="align-top">
                          <td className="py-2 pr-4 font-mono tabular-nums">
                            {r.row}
                          </td>
                          <td className="py-2 pr-4">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${STATUS_DOT[r.status]}`}
                                aria-hidden="true"
                              />
                              {STATUS_LABELS[r.status]}
                            </span>
                          </td>
                          <td className="py-2 pr-4">{r.name ?? "—"}</td>
                          <td className={`py-2 ${muted}`}>
                            {r.changes?.map((c) => (
                              <div key={c.field}>
                                {c.field}: {show(c.from)} →{" "}
                                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                                  {show(c.to)}
                                </span>
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {rows.length > MAX_ROWS_SHOWN && (
                <p className={`mt-2 text-xs ${muted}`}>
                  Showing the first {MAX_ROWS_SHOWN} of {rows.length} rows. All
                  of them will be imported.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={runImport}
                disabled={!canImport}
                className={btnPrimary}
              >
                {busy === "import"
                  ? "Importing…"
                  : summary.invalid > 0
                    ? "Import"
                    : `Import ${summary.insert + summary.update} player${summary.insert + summary.update === 1 ? "" : "s"}`}
              </button>
              {summary.invalid > 0 && (
                <span className="text-sm text-red-700 dark:text-red-400">
                  Fix the errors above to enable import.
                </span>
              )}
              {summary.invalid === 0 &&
                summary.insert + summary.update === 0 && (
                  <span className={`text-sm ${muted}`}>
                    Nothing would change.
                  </span>
                )}
            </div>
          </section>
        )}

        <details className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <summary className={`cursor-pointer text-sm font-semibold tracking-tight ${focusRing}`}>
            CSV rules
          </summary>
          <ul className={`mt-4 list-disc space-y-2 pl-5 text-sm ${muted}`}>
            <li>
              Required columns: <code className="font-mono text-neutral-900 dark:text-neutral-50">firstName</code>,{" "}
              <code className="font-mono text-neutral-900 dark:text-neutral-50">lastName</code>,{" "}
              <code className="font-mono text-neutral-900 dark:text-neutral-50">dateofBirth</code> (YYYY-MM-DD). Those
              three identify a player, ignoring upper/lower case: a match is
              updated, otherwise a new player is added.
            </li>
            <li>
              Optional columns: <code className="font-mono text-neutral-900 dark:text-neutral-50">nationality</code>,{" "}
              <code className="font-mono text-neutral-900 dark:text-neutral-50">position</code>,{" "}
              <code className="font-mono text-neutral-900 dark:text-neutral-50">currentTeam</code>,{" "}
              <code className="font-mono text-neutral-900 dark:text-neutral-50">Height</code> (cm),{" "}
              <code className="font-mono text-neutral-900 dark:text-neutral-50">preferredFoot</code> (Left, Right or
              Both), <code className="font-mono text-neutral-900 dark:text-neutral-50">goals</code>,{" "}
              <code className="font-mono text-neutral-900 dark:text-neutral-50">assists</code>,{" "}
              <code className="font-mono text-neutral-900 dark:text-neutral-50">minutesPlayed</code>.
            </li>
            <li>
              A{" "}
              <strong className="font-medium text-neutral-900 dark:text-neutral-50">
                blank cell or a missing column leaves the existing value alone
              </strong>
              . To deliberately remove a value, write{" "}
              <code className="font-mono text-neutral-900 dark:text-neutral-50">&lt;clear&gt;</code> in the cell.
            </li>
            <li>
              Positions: GK, CB, RB, LB, CDM, CM, CAM, RM, LM, RW, LW, CF, ST.
            </li>
            <li>
              Up to 5,000 players and 1 MB per file. Comma or semicolon
              separated; UTF-8 or Excel's default encoding.
            </li>
            <li>
              The import is all-or-nothing: if any row has an error, nothing is
              saved.
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}

export default AdminImport;
