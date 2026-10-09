import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { container, focusRing } from "./ui";
import ballImage from "../assets/lafabricaball.jpg";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/Players", label: "Players" },
];

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${focusRing} ${
    isActive
      ? "text-blue-600 dark:text-blue-500"
      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
  }`;

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className={`${container} flex h-14 items-center justify-between`}>
        <Link
          to="/"
          className={`flex items-center gap-2 rounded-md ${focusRing}`}
        >
          <img
            src={ballImage}
            alt="La Fabrica"
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-semibold tracking-tight">
            La Fabrica
            <span className="ml-1 font-normal text-neutral-500 dark:text-neutral-400">
              Tracker
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 md:hidden dark:text-neutral-400 dark:hover:text-neutral-50 ${focusRing}`}
        >
          {isOpen ? <FiX size={18} /> : <FiMenu size={18} />}
        </button>
      </div>

      {isOpen && (
        <nav
          className="border-t border-neutral-200 px-4 py-2 md:hidden dark:border-neutral-800"
          aria-label="Mobile"
        >
          <div className="flex flex-col">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setIsOpen(false)}
                className={linkClass}
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
