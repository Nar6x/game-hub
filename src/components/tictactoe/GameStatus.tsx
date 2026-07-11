"use client";

import { GameStatus as GameStatusType, Player, Difficulty, GameMode } from "@/lib/types";

interface GameStatusProps {
  status: GameStatusType;
  currentPlayer: Player;
  winner: Player | null;
  gameMode: GameMode;
  difficulty?: Difficulty;
}

export function GameStatus({
  status,
  currentPlayer,
  winner,
  gameMode,
  difficulty,
}: GameStatusProps) {
  if (status === "idle") return null;

  let message = "";
  let subMessage = "";

  if (status === "playing") {
    if (gameMode === "pve") {
      message = currentPlayer === "X" ? "Your Turn" : "AI is thinking...";
      subMessage =
        currentPlayer === "X"
          ? "Place your X"
          : difficulty === "hard"
            ? "Unbeatable AI calculating..."
            : difficulty === "medium"
              ? "AI is making a move..."
              : "AI picks a random spot...";
    } else {
      message = `Player ${currentPlayer}'s Turn`;
      subMessage = "Make your move";
    }
  } else if (status === "won") {
    if (gameMode === "pve") {
      message = winner === "X" ? "You Win!" : "AI Wins!";
      subMessage = winner === "X" ? "Congratulations!" : "Better luck next time";
    } else {
      message = `Player ${winner} Wins!`;
      subMessage = "Congratulations!";
    }
  } else if (status === "draw") {
    message = "It's a Draw!";
    subMessage = "Nobody wins this round";
  }

  return (
    <div className="text-center space-y-1">
      <h2
        className={`
          text-xl sm:text-2xl font-bold
          ${
            status === "won"
              ? winner === "X"
                ? "text-cyan-400"
                : "text-rose-400"
              : status === "draw"
                ? "text-amber-400"
                : currentPlayer === "X"
                  ? "text-cyan-400"
                  : "text-rose-400"
          }
        `}
      >
        {message}
      </h2>
      <p className="text-sm text-gray-400">{subMessage}</p>
    </div>
  );
}
