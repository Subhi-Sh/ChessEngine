import { Chess } from "chess.js";

export function normalizePgn(raw) {
  if (!raw) return "";
  let pgn = String(raw).replace(/\r\n/g, "\n").trim();

  // Ensure one blank line between headers and moves
  const hasHeaders = /^\s*\[/.test(pgn);
  if (hasHeaders) {
    pgn = pgn.replace(/\n{3,}/g, "\n\n");
    if (!/\n\n/.test(pgn)) {
      pgn = pgn.replace(/(\]\s*\n)(?!\n)/g, "$1\n");
    }
  }

  // Remove trailing incomplete token like "31. Raxe1"
  pgn = pgn.replace(/\s\d+\.(\.\.)?\s*$/m, "").trim();

  return pgn;
}

export function getVerboseMovesFromPgn(raw) {
  const pgn = normalizePgn(raw);
  const g = new Chess();

  // Support both chess.js v1+ (loadPgn) and v0.13 (load_pgn)
  const loader = g.loadPgn ? g.loadPgn.bind(g) : g.load_pgn?.bind(g);
  const ok = loader ? loader(pgn, { sloppy: true }) : false;

  if (!ok) return { moves: [], ok: false, pgn };
  return { moves: g.history({ verbose: true }), ok: true, pgn };
}