import { Link } from "react-router-dom";
import { container, muted } from "./ui";

function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800">
      <div
        className={`${container} flex flex-col gap-2 py-6 text-sm sm:flex-row sm:items-center sm:justify-between ${muted}`}
      >
        <p>La Fabrica Tracker · Youth academy player data</p>
        <nav className="flex gap-4" aria-label="Footer">
          <Link to="/Players" className="hover:text-neutral-900 dark:hover:text-neutral-50">
            Players
          </Link>
          <Link to="/admin/import" className="hover:text-neutral-900 dark:hover:text-neutral-50">
            Import
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
