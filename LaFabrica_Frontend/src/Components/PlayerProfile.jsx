import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// This function creates the playerProfile

/* separate data state and loading state for player and for scout report generation, Player profile screen should
load first not both at same time */
function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
/* Runs Whenever player ID changes ie when user clicks on player, if success, setPlayer as data and page 
is rerendered showing player */
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/players/${id}`);
        if (!response.ok) {
          throw new Error("Player not found");
        }
        const data = await response.json();
        setPlayer(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [id]);

  // Calculate age from dateofBirth , have to divide by miliseconds because JS converts dates to Unix Timestamp
  const getAge = (dob) => {
    if (!dob) return null;
    return Math.floor(
      (new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)
    );
  };

  // Request scout report from backend
  const handleScoutReport = async () => {
    setReportLoading(true);
    setReport(null);
    try {
      const response = await fetch(`http://localhost:3000/api/players/${id}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate report");
      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setReport("Failed to generate scout report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-lg animate-pulse">Loading player...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500 text-lg">Error: {error}</p>
      </div>
    );
  }
  const age = getAge(player.dateofBirth);
  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">

      {/* Back button */}
      <button
        onClick={() => navigate("/Players")}
        className="mb-6 text-blue-700 font-semibold hover:underline flex items-center gap-1"
      >
        Back to Players
      </button>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8 flex items-center gap-8 mb-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-700 to-gray-400 flex items-center justify-center text-4xl font-bold text-white shrink-0">
            {player.firstName?.[0]}{player.lastName?.[0]}
          </div>
          {/* Name and player info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {player.firstName} {player.lastName}
            </h1>
            <p className="text-blue-600 font-semibold mt-1">{player.position}</p>
            <p className="text-gray-500 mt-1">{player.currentTeam}</p>
            <p className="text-gray-400 text-sm mt-1">{player.nationality}</p>
            <p className="text-gray-400 text-sm mt-1">{age && `· ${age} years old`}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Physical Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Physical Attributes</h2>
            <div className="space-y-3">
              <Row label="Height" value={player.Height ? `${player.Height} cm` : "—"} />
              <Row label="Preferred Foot" value={player.preferredFoot ?? "—"} />
              <Row label="Date of Birth" value={player.dateofBirth ? new Date(player.dateofBirth).toLocaleDateString() : "—"} />
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Stats</h2>
            <div className="space-y-3">
              <Row label="Goals" value={player.goals ?? "—"} />
              <Row label="Assists" value={player.assists ?? "—"} />
              <Row label="Minutes Played" value={player.minutesPlayed ? `${player.minutesPlayed} minutes` : "—"} />
            </div>
          </div>
        </div>

        {/* Scout Report Section */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">Scout Report</h2>
            <button
              onClick={handleScoutReport}
              /*Once button is clicked and report is being fetced prevents User from spamming button 
              and sending multiple API requests to Ai Endpoint
              */
              disabled={reportLoading}
              className="bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-800 transition-colors duration-200"
            >
              {/*if reportLoading is true show "Generating...", otherwise show "Get Scout Report" */}
              {reportLoading ? "Generating..." : "Get Scout Report"}
            </button>
          </div>

          {/* Report output */}
          {!report && !reportLoading && (
            <p className="text-gray-400 text-sm">
              Click "Get Scout Report" to generate AI-powered projection and comparison for this player.
            </p>
          )}
          {reportLoading && (
            <p className="text-gray-500 animate-pulse">Analyzing player data...</p>
          )}
          {report && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{report}</p>
          )}
        </div>

      </div>
    </div>
  );
}

//Reusable row function for each row in player card
function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

export default PlayerProfile;
