import React, { useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Board from "../components/Board.jsx"; // ADD THIS

export default function GameDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const game = location.state?.game;
  const getHeader = (pgn, key) => pgn?.match(new RegExp(`\\[${key} \"(.*?)\"\\]`))?.[1] ?? "";


  const [currentMove, setCurrentMove] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);

  const pgn = useMemo(() => game?.pgn ?? "", [game?.pgn]);
  
  const termination = getHeader(pgn, "Termination"); 
  const result = getHeader(pgn, "Result");         


  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xl">No game data found.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const handleMoveChange = (current, total) => {
    setCurrentMove(current);
    setTotalMoves(total);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Back to Games
        </button>

        <h1 className="text-2xl font-bold mb-6">Chess Game Analysis</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2">
            {pgn ? (
              <Board
                pgn={pgn}
                onMoveChange={handleMoveChange}
                boardHeight={560} // or compute from container for responsiveness
                termination={termination}
                result={result}
              />
            ) : (
              <div className="bg-gray-800 p-6 rounded-lg">No PGN provided.</div>
            )}
          </div>

          <div className="w-full lg:w-1/2 space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Game Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">White</p>
                  <p className="font-medium">{game.white?.username}</p>
                  <p className="text-sm text-gray-400">Rating: {game.white?.rating}</p>
                </div>
                <div>
                  <p className="text-gray-400">Black</p>
                  <p className="font-medium">{game.black?.username}</p>
                  <p className="text-sm text-gray-400">Rating: {game.black?.rating}</p>
                </div>
                <div>
                  <p className="text-gray-400">Result</p>
                  <p className="font-medium">
                    {pgn.match(/\[Result \"(.*?)\"\]/)?.[1] || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Date</p>
                  <p className="font-medium">
                    {new Date(game.end_time * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

       
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Game Analysis</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Moves</span>
                  <span>{totalMoves}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Position</span>
                  <span>{currentMove > 0 ? `After ${currentMove} moves` : "Starting position"}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">PGN</h2>
              <div className="bg-gray-900 p-4 rounded overflow-x-auto">
                <pre className="text-sm whitespace-pre-wrap">{pgn}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}