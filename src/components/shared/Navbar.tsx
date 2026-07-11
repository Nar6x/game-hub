"use client";

import Link from "next/link";
import { useUser } from "./UserContext";

export function Navbar() {
  const { username, isSet } = useUser();

  return (
    <nav className="w-full border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent"
        >
          GameHub
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <Link
            href="/tictactoe"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Tic Tac Toe
          </Link>
          <Link
            href="/snakes-and-ladders"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Snakes & Ladders
          </Link>
          <Link
            href="/leaderboard"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Leaderboard
          </Link>

          {isSet && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-700">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-rose-400 flex items-center justify-center text-xs font-bold text-gray-950">
                {username[0]?.toUpperCase()}
              </div>
              <span className="text-gray-300 hidden sm:inline">{username}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
