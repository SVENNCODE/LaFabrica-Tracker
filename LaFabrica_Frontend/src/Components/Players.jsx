import { useEffect, useState } from "react";
import PlayerCard from "./PlayerCard";
/* This function should return the player screen if successful which shows all player cards in the database, if an error is reached
screen should display an error message and return*/
function Players() {
  /* Three pieces of state. players starts as an empty array and will hold the fetched data. loading starts as true because the 
moment the page loads function should already be fetching. Change to false when done. error starts as null and only gets set if 
something goes wrong. 
*/
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 /* This fetch makes the HTTP request to backend. if the backend returns a 404 or 500, manually throw an error to jump into 
 the catch block.If no error json() parses the response body, then setPlayers(data) stores it in state which triggers a re-render 
 with the player data. Finally setLoading is set to false so players can display.
 */
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/players");
        if (!response.ok) throw new Error("Failed to fetch players");
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);
 //This code is just for the loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-lg animate-pulse">Loading players...</p>
      </div>
    );
  }
// Error Message layout
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500 text-lg">Error: {error}</p>
      </div>
    );
  }
/*This code returns the screen with all the players in a column grid, # of cols depending on screen size,
map() loops over every player in the array and returns a PlayerCard for each one. */
  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Players</h1>
      <p className="text-gray-500 mb-8">{players.length} players in the academy</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}

export default Players;
