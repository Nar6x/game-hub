"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/components/shared/UserContext";
import { PageTransition } from "@/components/shared/PageTransition";
import { LeaderboardEntry, GameType } from "@/lib/types";

export default function LeaderboardPage() {
  const { username } = useUser();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeGame, setActiveGame] = useState<GameType>("tictactoe");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      const { data } = await supabase
        .from("leaderboard")
        .select("player_name, wins, losses, draws")
        .eq("game_type", activeGame)
        .order("wins", { ascending: false })
        .limit(20);

      const result: LeaderboardEntry[] = (data || []).map((row) => ({
        id: row.player_name,
        player_name: row.player_name,
        game_type: activeGame,
        wins: row.wins,
        losses: row.losses,
        draws: row.draws,
        created_at: "",
      }));

      setEntries(result);
      setLoading(false);
    }

    fetchLeaderboard();
  }, [activeGame]);

  const totalGames = (e: LeaderboardEntry) => e.wins + e.losses + e.draws;
  const winRate = (e: LeaderboardEntry) => {
    const total = totalGames(e);
    return total > 0 ? Math.round((e.wins / total) * 100) : 0;
  };

  return (
    <PageTransition>
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-sm text-gray-400">Top players by wins</p>
        </div>

        <div className="flex gap-2 justify-center">
          {([
            { key: "tictactoe" as GameType, label: "Tic Tac Toe" },
            { key: "snakes" as GameType, label: "Snakes & Ladders" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveGame(key)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${
                  activeGame === key
                    ? "bg-amber-500/20 border border-amber-400/50 text-amber-400"
                    : "bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:text-gray-300"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg animate-pulse">
                  <div className="w-6 h-4 bg-gray-700 rounded" />
                  <div className="flex-1 h-4 bg-gray-700 rounded" />
                  <div className="w-8 h-4 bg-gray-700 rounded" />
                  <div className="w-8 h-4 bg-gray-700 rounded" />
                  <div className="w-8 h-4 bg-gray-700 rounded" />
                  <div className="w-12 h-4 bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No leaderboard data yet. Play some games!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Player
                    </th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">
                      W
                    </th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">
                      L
                    </th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">
                      D
                    </th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">
                      Win %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`
                        border-b border-gray-800/50
                        ${entry.player_name === username ? "bg-gray-800/30" : ""}
                      `}
                    >
                      <td className="px-4 py-3 text-gray-500">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            entry.player_name === username
                              ? "text-amber-400 font-medium"
                              : "text-gray-200"
                          }
                        >
                          {entry.player_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-emerald-400">
                        {entry.wins}
                      </td>
                      <td className="px-4 py-3 text-center text-rose-400">
                        {entry.losses}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {entry.draws}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">
                        {winRate(entry)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
    </PageTransition>
  );
}
