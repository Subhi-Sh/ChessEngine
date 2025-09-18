import React, { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

// Parse SANs manually so messy PGNs still work
function pgnToVerboseMoves(raw) {
  if (!raw) return [];
  let pgn = String(raw).replace(/\r\n/g, "\n").trim();
  const parts = pgn.split(/\n\s*\n/);
  const movesPart = parts.length > 1 ? parts.slice(1).join("\n") : parts[0];
  let movesText = movesPart
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\$\d+/g, " ")
    .replace(/\b1-0\b|\b0-1\b|\b1\/2-1\/2\b|\*/g, " ")
    .replace(/\d+\.(\.\.)?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!movesText) return [];
  const sans = movesText.split(" ").filter(Boolean);
  const g = new Chess();
  const verbose = [];
  for (const san of sans) {
    const res = g.move(san, { sloppy: true });
    if (!res) break;
    verbose.push(res);
  }
  return verbose;
}

function getKingSquare(fen, color) {
  const g = new Chess(fen);
  const board = g.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (sq && sq.type === "k" && sq.color === color) {
        const file = "abcdefgh"[c];
        const rank = 8 - r;
        return `${file}${rank}`;
      }
    }
  }
  return null;
}

function parseResigningSide(termination) {
  if (!termination) return null;
  if (/white\s+resign/i.test(termination)) return "w";
  if (/black\s+resign/i.test(termination)) return "b";
  return null;
}

export default function Board({
  pgn,
  boardWidth = 560,
  onMoveChange,
  termination = "",
  result = "",
}) {
  const [fen, setFen] = useState(new Chess().fen());
  const [idx, setIdx] = useState(0);

  const verboseMoves = useMemo(() => {
    const parsed = pgnToVerboseMoves(pgn);
    return parsed.length ? parsed : pgnToVerboseMoves("1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *");
  }, [pgn]);

  // UI state
  const [isCheck, setIsCheck] = useState(false);
  const [lastFrom, setLastFrom] = useState(null);
  const [lastTo, setLastTo] = useState(null);
  const [endLabel, setEndLabel] = useState("");

  // Parent sync
  useEffect(() => {
    onMoveChange?.(idx, verboseMoves.length);
  }, [idx, verboseMoves.length, onMoveChange]);

  // Rebuild position on idx change
  useEffect(() => {
    const g = new Chess();
    let last = null;
    for (let i = 0; i < Math.min(idx, verboseMoves.length); i++) {
      last = verboseMoves[i];
      g.move({ from: last.from, to: last.to, promotion: last.promotion });
    }
    setFen(g.fen());
    setLastFrom(last?.from ?? null);
    setLastTo(last?.to ?? null);

    let label = "";
    if (idx === verboseMoves.length) {
      if (g.isCheckmate()) {
        label = "Checkmate";
      } else if (/resign/i.test(termination)) {
        label = /white/i.test(termination)
          ? "White resigned"
          : /black/i.test(termination)
          ? "Black resigned"
          : "Resignation";
      } else if (g.isStalemate()) {
        label = "Stalemate";
      } else if (g.isDraw()) {
        label = "Draw";
      } else if (result === "1-0" || result === "0-1" || result === "1/2-1/2") {
        label = result;
      }
    }
    setEndLabel(label);

    setIsCheck(g.inCheck());
  }, [idx, verboseMoves, termination, result]);

  // Keyboard: Left/Right, R reset, L latest
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setIdx((i) => Math.min(verboseMoves.length, i + 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      else if (e.key.toLowerCase() === "r") setIdx(0);
      else if (e.key.toLowerCase() === "l") setIdx(verboseMoves.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [verboseMoves.length]);

  // Highlights: last move, check, resignation ring
  const customSquareStyles = useMemo(() => {
    const styles = {};
    if (lastFrom) styles[lastFrom] = { background: "rgba(255, 215, 0, 0.35)" };
    if (lastTo) styles[lastTo] = { background: "rgba(255, 215, 0, 0.35)" };

    // Check highlight on side-to-move king
    if (isCheck) {
      const side = fen.split(" ")[1]; // 'w' | 'b'
      const kingSq = getKingSquare(fen, side);
      if (kingSq) {
        styles[kingSq] = {
          boxShadow: "inset 0 0 0 3px rgba(220, 38, 38, 0.95)",
          background: "rgba(254, 226, 226, 0.6)",
        };
      }
    }

    // Resignation ring at final position
    if (idx === verboseMoves.length && /resign/i.test(termination)) {
      const resigning = parseResigningSide(termination);
      const kingSq = resigning ? getKingSquare(fen, resigning) : null;
      if (kingSq) {
        styles[kingSq] = {
          boxShadow:
            "inset 0 0 0 4px rgba(239, 68, 68, 1), 0 0 16px rgba(239, 68, 68, 0.6)",
          background: "rgba(254, 202, 202, 0.45)",
        };
      }
    }

    return styles;
  }, [lastFrom, lastTo, isCheck, fen, idx, termination, verboseMoves.length]);

  const canPrev = idx > 0;
  const canNext = idx < verboseMoves.length;

  return (
    <div className="w-[560px]">
      <div className="relative">
        <Chessboard
          key={fen}
          position={fen}
          boardWidth={boardWidth}
          arePiecesDraggable={false}
          animationDuration={360} // smoother feel
          customBoardStyle={{
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
          customDarkSquareStyle={{
            backgroundColor: "#8c6f50",
            transition: "background-color 200ms ease",
          }}
          customLightSquareStyle={{
            backgroundColor: "#e8d0a1",
            transition: "background-color 200ms ease",
          }}
          customSquareStyles={customSquareStyles}
        />

        {/* End badge: styled for resignation/mate/draw */}
        {idx === verboseMoves.length && endLabel && (
          <div
            className={`absolute left-1/2 -translate-x-1/2 -bottom-10 text-xs px-3 py-1 rounded shadow
              ${
                /resign/i.test(endLabel)
                  ? "bg-red-900/80 text-red-200"
                  : /mate/i.test(endLabel)
                  ? "bg-emerald-900/80 text-emerald-200"
                  : "bg-gray-800/90 text-gray-100"
              }`}
          >
            {endLabel}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <button
          className={`px-3 py-2 rounded ${
            canPrev ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-700/50 cursor-not-allowed"
          }`}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={!canPrev}
          title="Previous (Left Arrow)"
        >
          ◀
        </button>
        <button
          className={`px-3 py-2 rounded ${
            canNext ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-700/50 cursor-not-allowed"
          }`}
          onClick={() => setIdx((i) => Math.min(verboseMoves.length, i + 1))}
          disabled={!canNext}
          title="Next (Right Arrow)"
        >
          ▶
        </button>
        <button
          className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600"
          onClick={() => setIdx(0)}
          title="Reset"
        >
          ⟲ Reset
        </button>
        <button
          className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700"
          onClick={() => setIdx(verboseMoves.length)}
          title="Latest"
        >
          ⤓ Latest
        </button>
        <div className="ml-auto text-gray-300">
          {idx}/{verboseMoves.length}
        </div>
      </div>
    </div>
  );
}