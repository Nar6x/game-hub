import { supabase } from "@/lib/supabase/client";
import { GameType } from "@/lib/types";

export async function updateLeaderboard(
  playerName: string,
  gameType: GameType,
  result: "win" | "loss" | "draw"
) {
  if (!playerName) return;

  const { error } = await supabase.rpc("update_leaderboard", {
    p_player_name: playerName,
    p_game_type: gameType,
    p_wins: result === "win" ? 1 : 0,
    p_losses: result === "loss" ? 1 : 0,
    p_draws: result === "draw" ? 1 : 0,
  });

  if (error) {
    console.error("Failed to update leaderboard:", error.message, error);
  }
}
