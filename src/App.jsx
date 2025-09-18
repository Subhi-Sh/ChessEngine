import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import Gamehistory from "./components/Gamehistory.jsx";
import GameDetails from "./components/GameDetails.jsx"; 

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0e141b] text-white">
        <Routes>
          <Route path="/" element={<Gamehistory />} />
          <Route path="/game/:id" element={<GameDetails />} />
        </Routes>
      </div>
   
    </Router>
  );
}
