"use client";

import { Scores, Player, Difficulty, GameMode } from "@/lib/types";

interface ScoreBoardProps {
  scores: Scores;
  currentPlayer: Player;
  gameMode: GameMode;
  difficulty?: Difficulty;
}

export function ScoreBoard({
  scores,
  currentPlayer,
  gameMode,
  difficulty,
}: ScoreBoardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {gameMode === "pve" && difficulty && (
        <div className="text-xs text-gray-500 uppercase tracking-wider">
          Difficulty:{" "}
          <span
            className={
              difficulty === "easy"
                ? "text-emerald-400"
                : difficulty === "medium"
                  ? "text-amber-400"
                  : "text-rose-400"
            }
          >
            {difficulty}
          </span>
        </div>
      )}
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <ScoreCard
          label={gameMode === "pve" ? "You" : "Player X"}
          score={scores.X}
          isActive={currentPlayer === "X"}
          color="cyan"
        />
        <ScoreCard
          label="Draws"
          score={scores.draws}
          isActive={false}
          color="gray"
        />
        <ScoreCard
          label={gameMode === "pve" ? "AI" : "Player O"}
          score={scores.O}
          isActive={currentPlayer === "O"}
          color="rose"
        />
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  score,
  isActive,
  color,
}: {
  label: string;
  score: number;
  isActive: boolean;
  color: "cyan" | "rose" | "gray";
}) {
  const colorStyles = {
    cyan: "border-cyan-400/30",
    rose: "border-rose-400/30",
    gray: "border-gray-500/30",
  };

  return (
    <div
      className={`
        flex flex-col items-center px-4 sm:px-6 py-3 rounded-xl
        bg-gray-800/50 border transition-all duration-300
        ${colorStyles[color]}
        ${isActive ? "scale-105 shadow-lg" : "opacity-70"}
      `}
    >
      <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`
          text-2xl sm:text-3xl font-bold tabular-nums
          ${color === "cyan" ? "text-cyan-400" : color === "rose" ? "text-rose-400" : "text-gray-300"}
        `}
      >
        {score}
      </span>
    </div>
  );
}
