import { Link } from "react-router-dom";
import { FiSearch, FiSliders, FiCpu, FiUpload } from "react-icons/fi";
import SearchBar from "./Searchbar";
import { container, btnPrimary, btnSecondary, muted } from "./ui";

const features = [
  {
    icon: FiSearch,
    title: "Instant search",
    body: "Find any player in the academy by name as you type.",
  },
  {
    icon: FiSliders,
    title: "Filter and sort",
    body: "Narrow the roster by position and team, then rank by goals, assists or minutes.",
  },
  {
    icon: FiCpu,
    title: "AI scout reports",
    body: "Generate a projection and comparison for any player from their recorded data.",
  },
  {
    icon: FiUpload,
    title: "CSV import",
    body: "Add or update players in bulk with a validated, previewable import.",
  },
];

function Home() {
  return (
    <>
      <section className="border-b border-neutral-200 dark:border-neutral-800">
        <div className={`${container} py-20 sm:py-28`}>
          <div className="mx-auto max-w-2xl text-center">
            <p className={`text-sm font-medium ${muted}`}>
              Real Madrid Youth academy analytics
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Know every player in the academy.
            </h1>
            <p className={`mt-4 text-base leading-relaxed ${muted}`}>
              Search the roster, compare performance data and generate
              AI-assisted scouting reports.
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <SearchBar />
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Link to="/Players" className={btnPrimary}>
                Browse players
              </Link>
              <Link to="/admin/import" className={btnSecondary}>
                Import data
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={`${container} py-16`}>
        <h2 className="text-lg font-semibold tracking-tight">
          Built for academy staff
        </h2>
        <p className={`mt-1 text-sm ${muted}`}>
          Everything you need to review players, with nothing in the way.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-800">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-6 dark:bg-neutral-950">
              <f.icon size={18} className={muted} aria-hidden="true" />
              <h3 className="mt-4 text-sm font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className={`mt-1 text-sm leading-relaxed ${muted}`}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
