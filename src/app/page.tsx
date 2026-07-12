"use client";

import { useUser } from "@/components/shared/UserContext";
import { GameCard } from "@/components/shared/GameCard";
import { PageTransition } from "@/components/shared/PageTransition";
import Link from "next/link";

export default function Home() {
  const { username, isSet } = useUser();

  return (
    <PageTransition>
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-8 sm:space-y-12">
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
            GameHub
          </h1>
          {isSet ? (
            <p className="text-gray-400">
              Welcome back, <span className="text-white font-medium">{username}</span>
            </p>
          ) : (
            <p className="text-gray-400">Pick a game and start playing</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <GameCard
            title="Tic Tac Toe"
            description="Classic X and O. Play online with friends or challenge AI opponents at different difficulties."
            icon="XO"
            color="cyan"
            href="/tictactoe"
          >
            <div className="flex gap-2 mt-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                PvP
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                vs AI
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                Online
              </span>
            </div>
          </GameCard>

          <GameCard
            title="Snakes & Ladders"
            description="Roll the dice, climb ladders, avoid snakes. Race your friends to the finish line."
            icon="1-6"
            color="emerald"
            href="/snakes-and-ladders"
          >
            <div className="flex gap-2 mt-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                2-4 Players
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                Local
              </span>
            </div>
          </GameCard>
        </div>

        <div className="text-center">
          <Link
            href="/leaderboard"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            View Leaderboard →
          </Link>
        </div>
      </div>
    </main>
    </PageTransition>
  );
}
