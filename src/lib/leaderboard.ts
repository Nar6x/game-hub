import { supabase } from "@/lib/supabase/client";
import { GameType } from "@/lib/types";

export async function updateLeaderboard(
  playerName: string,
  gameType: GameType,
  result: "win" | "loss" | "draw"
) {
  if (!playerName) return;

  const { error } = await supabase.from("leaderboard").insert({
    player_name: playerName,
    game_type: gameType,
    wins: result === "win" ? 1 : 0,
    losses: result === "loss" ? 1 : 0,
    draws: result === "draw" ? 1 : 0,
  });

  if (error) {
    console.error("Failed to update leaderboard:", error.message);
  }
}
