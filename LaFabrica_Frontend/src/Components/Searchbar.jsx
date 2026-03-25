import {FaSearch} from "react-icons/fa";
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import "./Searchbar.css";
/* Live SearchBar - should fetch player data from database matching user input as user type and a display a dropdown of names 
  instantly searching for matches after each character typed, Once the backend sends back the JSON list of players
  saves that list into the component's memory. */
export const SearchBar = () => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
 //If users backspaces everything, function returns and doesn't stay stuck on last search
  const fetchData = async (value) => {
    if (!value) {
      setResults([]);
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/api/players/search?query=${value}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };
    const handleSelect = (player) => {
    setInput("");       // Clear the search input
    setResults([]);     // Close the dropdown
    navigate(`/Players/${player.id}`);  // Go to player page
    };
  return (
    <div className="input-wrapper">
      <FaSearch id="searchIcon" />
      <input
        placeholder="Search Player.."
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          fetchData(e.target.value);
        }}
      />
      
      {results.length > 0 && (
        <div className="playerResult">
          {results.map((player) => (
            <div
              key={player.id}
              className="playerItem"
              onClick={() => handleSelect(player)}
            >
              {player.firstName} {player.lastName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
