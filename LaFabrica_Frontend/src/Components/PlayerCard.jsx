import { useNavigate } from "react-router-dom";

function PlayerCard({ player }) {
  const navigate = useNavigate();
  const fullName = `${player.firstName} ${player.lastName}`;

  // Calculate age from dateofBirth
  const age = player.dateofBirth
    ? Math.floor(
        (new Date() - new Date(player.dateofBirth)) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div
      onClick={() => navigate(`/Players/${player.id}`)}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden group"
    >
      <div className="bg-gradient-to-br from-gray-700 to-gray-500 h-48 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-4xl text-gray-500 font-bold select-none">
          {player.firstName?.[0]}{player.lastName?.[0]}
        </div>
      </div>

      {/* Player Info */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors duration-200">
          {fullName}
        </h2>
        <p className="text-sm text-blue-600 font-semibold mt-1">{player.position}</p>
        <div className="mt-3 flex justify-between text-sm text-gray-500">
          <span>{player.nationality}</span>
          {age && <span>{age} yrs</span>}
        </div>
        <div className="mt-1 text-sm text-gray-500 truncate">
          {player.currentTeam}
        </div>
      </div>
    </div>
  );
}

export default PlayerCard;
