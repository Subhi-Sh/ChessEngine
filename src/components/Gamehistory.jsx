import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GameHistory() {
  const [username, setUsername] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const gamesPerPage = 10;

  const navigate = useNavigate();

  async function fetchGames(user) {
    if (!user) return;

    setLoading(true);
    setGames([]);
    setPage(1);
    setError("");

    try {
      // 1. Fetch archives
      const res = await fetch(
        `https://api.chess.com/pub/player/${user}/games/archives`
      );

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`User "${user}" not found on Chess.com`);
        } else {
          throw new Error(`Error: ${res.status} ${res.statusText}`);
        }
      }

      const data = await res.json();

      if (!data.archives || data.archives.length === 0) {
        throw new Error("No games found for this user.");
      }

      let allGames = [];

      // 2. Fetch only last 3 months for performance
      for (
        let i = data.archives.length - 1;
        i >= Math.max(data.archives.length - 3, 0);
        i--
      ) {
        const resGames = await fetch(data.archives[i]);
        const monthData = await resGames.json();
        allGames.push(...monthData.games);
      }

      // 3. Sort newest first and add unique IDs
      allGames.sort((a, b) => b.end_time - a.end_time);
      
      // Add unique IDs to each game
      const gamesWithIds = allGames.map((game, index) => ({
        ...game,
        uniqueId: `${user}-${game.end_time}-${index}`
      }));

      setGames(gamesWithIds);
      setUsername(""); // empty the username field
    } catch (err) {
      setError(err.message || "Something went wrong while fetching games.");
      setGames([]);
      setUsername(""); // empty the username field
    } finally {
      setLoading(false);
    }
  }

  // Pagination logic
  const startIndex = (page - 1) * gamesPerPage;
  const currentGames = games.slice(startIndex, startIndex + gamesPerPage);
  const totalPages = Math.ceil(games.length / gamesPerPage);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-center">Chess Game History</h1>
        
        {/* Input + button */}
        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="Enter Chess.com username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchGames(username.trim())}
            className="p-3 rounded-l-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-white w-72"
          />
          <button
            onClick={() => fetchGames(username.trim())}
            disabled={!username.trim()}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-r-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Fetch Games
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            <p className="mt-2">Loading games...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900 text-red-200 p-4 rounded-lg text-center font-semibold mt-4">
            {error}
          </div>
        )}

        {/* Results count */}
        {games.length > 0 && (
          <div className="mb-4 text-gray-400">
            Found {games.length} games
          </div>
        )}

        {/* Games list */}
        <div className="space-y-4">
          {currentGames.map((game) => (
            <div
              key={game.uniqueId}
              className="flex justify-between items-center bg-gray-800 p-5 rounded-lg shadow-lg hover:bg-gray-750 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-white rounded-full mr-2"></div>
                  <span className="font-semibold text-white">
                    {game.white.username}
                  </span>
                  <span className="text-gray-400 ml-2">({game.white.rating})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-black rounded-full mr-2 border border-gray-400"></div>
                  <span className="font-semibold text-white">
                    {game.black.username}
                  </span>
                  <span className="text-gray-400 ml-2">({game.black.rating})</span>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {new Date(game.end_time * 1000).toLocaleDateString()} • {game.time_class}
                </div>
              </div>
              <button
                onClick={() => navigate(`/game/${game.uniqueId}`, { state: { game } })}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Analyze Game
              </button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {games.length > 0 && (
          <div className="flex justify-center items-center mt-8 space-x-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && games.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">♜</div>
            <p>Enter a Chess.com username to view game history</p>
          </div>
        )}
      </div>
    </div>
  );
}