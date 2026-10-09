import { FiSearch } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { focusRing } from "./ui";

export const SearchBar = () => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const term = useDebouncedValue(input.trim(), 250);

  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    fetch(`${API_URL}/api/players/search?query=${encodeURIComponent(term)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Search failed (HTTP ${response.status})`);
        return response.json();
      })
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .catch((error) => {
        if (error.name === "AbortError") return;
        console.error("Error fetching data", error);
        setResults([]);
      });
    return () => controller.abort();
  }, [term]);

  const visibleResults = input.trim() ? results : [];

  const handleSelect = (player) => {
    setInput("");
    setResults([]);
    navigate(`/Players/${player.id}`);
  };

  return (
    <div className="relative w-full">
      <FiSearch
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
        size={16}
        aria-hidden="true"
      />
      <input
        type="search"
        aria-label="Search players"
        placeholder="Search players by name"
        autoComplete="off"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setInput("");
          if (e.key === "Enter" && visibleResults.length > 0)
            handleSelect(visibleResults[0]);
        }}
        className={`h-11 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 ${focusRing}`}
      />

      {visibleResults.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 dark:border-neutral-800 dark:bg-neutral-950">
          {visibleResults.map((player) => (
            <li key={player.id}>
              <button
                type="button"
                onClick={() => handleSelect(player)}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none dark:text-neutral-50 dark:hover:bg-neutral-900 dark:focus-visible:bg-neutral-900"
              >
                {player.firstName} {player.lastName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
