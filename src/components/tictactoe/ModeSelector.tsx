"use client";

import { useState } from "react";
import { Difficulty } from "@/lib/types";

interface ModeSelectorProps {
  onSelect: (mode: "pvp" | "pve", difficulty?: Difficulty) => void;
  onOnline: () => void;
}

export function ModeSelector({ onSelect, onOnline }: ModeSelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("medium");

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
          Tic Tac Toe
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Choose your game mode
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSelect("pvp")}
            className="
              group px-4 py-4 rounded-xl
              bg-gray-800/60 border border-cyan-400/20
              hover:border-cyan-400/50 hover:bg-gray-800/80
              transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-cyan-400
            "
          >
            <div className="text-cyan-400 text-xl mb-1">PvP</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">
              Local 2 players
            </div>
          </button>

          <button
            onClick={() => onSelect("pve", selectedDifficulty)}
            className="
              group px-4 py-4 rounded-xl
              bg-gray-800/60 border border-rose-400/20
              hover:border-rose-400/50 hover:bg-gray-800/80
              transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-rose-400
            "
          >
            <div className="text-rose-400 text-xl mb-1">vs AI</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">
              Challenge computer
            </div>
          </button>
        </div>

        <button
          onClick={onOnline}
          className="
            group w-full px-4 py-3 rounded-xl
            bg-gray-800/60 border border-emerald-400/20
            hover:border-emerald-400/50 hover:bg-gray-800/80
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-emerald-400
          "
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Play Online</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Find a match or share a room code
          </div>
        </button>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <p className="text-xs text-gray-500 text-center uppercase tracking-wider">
          AI Difficulty
        </p>
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium
                transition-all duration-200 capitalize
                focus:outline-none
                ${
                  selectedDifficulty === diff
                    ? diff === "easy"
                      ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-400"
                      : diff === "medium"
                        ? "bg-amber-500/20 border border-amber-400/50 text-amber-400"
                        : "bg-rose-500/20 border border-rose-400/50 text-rose-400"
                    : "bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:text-gray-300 hover:border-gray-600"
                }
              `}
            >
              {diff}
            </button>
          ))}
        </div>
        <div className="text-center text-xs text-gray-600">
          {selectedDifficulty === "easy" && "Random moves, easy to beat"}
          {selectedDifficulty === "medium" && "Mix of smart and random moves"}
          {selectedDifficulty === "hard" && "Unbeatable minimax algorithm"}
        </div>
      </div>
    </div>
  );
}
