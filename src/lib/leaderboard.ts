import { supabase } from "@/lib/supabase/client";
import { GameType } from "@/lib/types";

export async function updateLeaderboard(
  playerName: string,
  gameType: GameType,
  result: "win" | "loss" | "draw"
) {
  const { data: existing } = await supabase
    .from("leaderboard")
    .select("id, wins, losses, draws")
    .eq("player_name", playerName)
    .eq("game_type", gameType)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, number> = {};
    if (result === "win") updates.wins = existing.wins + 1;
    else if (result === "loss") updates.losses = existing.losses + 1;
    else updates.draws = existing.draws + 1;

    await supabase
      .from("leaderboard")
      .update(updates)
      .eq("id", existing.id);
  } else {
    await supabase.from("leaderboard").insert({
      player_name: playerName,
      game_type: gameType,
      wins: result === "win" ? 1 : 0,
      losses: result === "loss" ? 1 : 0,
      draws: result === "draw" ? 1 : 0,
    });
  }
}
