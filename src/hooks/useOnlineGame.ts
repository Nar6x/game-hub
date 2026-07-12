"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/components/shared/UserContext";
import { Board, MatchStats } from "@/lib/types";
import { checkWinner, isBoardFull, createEmptyBoard } from "@/lib/gameLogic/tictactoe";
import { updateLeaderboard } from "@/lib/leaderboard";
import { RealtimeChannel } from "@supabase/supabase-js";

interface OnlineGameState {
  board: Board;
  currentPlayer: "X" | "O";
  mySymbol: "X" | "O" | null;
  roomId: string | null;
  inviteCode: string | null;
  status: "idle" | "waiting" | "playing" | "won" | "draw" | "opponent_left";
  winner: "X" | "O" | null;
  winningLine: number[] | null;
  opponentName: string | null;
  matchStats: MatchStats;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const DEFAULT_STATS: MatchStats = { p1_wins: 0, p2_wins: 0, draws: 0, games_played: 0 };
const STALE_MINUTES = 5;

async function cleanupStaleRooms() {
  const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();
  await supabase
    .from("rooms")
    .delete()
    .in("status", ["waiting", "playing", "left"])
    .lt("created_at", cutoff);
}

export function useOnlineGame() {
  const { username } = useUser();
  const [state, setState] = useState<OnlineGameState>({
    board: createEmptyBoard(),
    currentPlayer: "X",
    mySymbol: null,
    roomId: null,
    inviteCode: null,
    status: "idle",
    winner: null,
    winningLine: null,
    opponentName: null,
    matchStats: { ...DEFAULT_STATS },
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const leaderboardRecordedRef = useRef<string | null>(null);

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    roomIdRef.current = null;
  }, []);

  useEffect(() => {
    cleanupStaleRooms();
    return cleanupChannel;
  }, [cleanupChannel]);

  const recordLeaderboard = useCallback(
    (winnerName: string | null, player1Name: string, player2Name: string | null) => {
      const dedupKey = `${winnerName ?? "draw"}-${player1Name}-${player2Name ?? ""}`;
      if (leaderboardRecordedRef.current === dedupKey) return;
      leaderboardRecordedRef.current = dedupKey;

      const isDraw = winnerName === null;

      if (player1Name) {
        const result: "win" | "loss" | "draw" = isDraw ? "draw" : winnerName === player1Name ? "win" : "loss";
        updateLeaderboard(player1Name, "tictactoe", result);
      }

      if (player2Name) {
        const result: "win" | "loss" | "draw" = isDraw ? "draw" : winnerName === player2Name ? "win" : "loss";
        updateLeaderboard(player2Name, "tictactoe", result);
      }
    },
    []
  );

  const subscribeToRoom = useCallback(
    (roomId: string) => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      roomIdRef.current = roomId;
      leaderboardRecordedRef.current = null;

      const channel = supabase
        .channel(`room:${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rooms",
            filter: `id=eq.${roomId}`,
          },
          (payload) => {
            if (payload.eventType === "DELETE") {
              setState((prev) => ({
                ...prev,
                status: "opponent_left",
                opponentName: null,
              }));
              return;
            }

            const room = payload.new as {
              state: { board: Board; current_player: "X" | "O" };
              player1_name: string;
              player2_name: string | null;
              status: string;
              winner: string | null;
              match_stats?: MatchStats;
            };

            if (room.status === "left") {
              setState((prev) => ({
                ...prev,
                status: "opponent_left",
                opponentName: null,
              }));
              return;
            }

            const hasWinner = room.winner === "X" || room.winner === "O";
            const boardFull = isBoardFull(room.state.board);
            const { winningLine } = hasWinner ? checkWinner(room.state.board) : { winningLine: null };

            if (room.status === "finished") {
              const winnerName = room.winner === "X" ? room.player1_name
                : room.winner === "O" ? room.player2_name
                  : null;
              const isDraw = room.winner === null;
              const iAmWinner = winnerName === username;
              if (iAmWinner || (isDraw && room.player1_name === username)) {
                recordLeaderboard(winnerName, room.player1_name, room.player2_name);
              }
            }

            setState((prev) => {
              let newStatus: OnlineGameState["status"] = prev.status;

              if (room.status === "playing" && prev.status === "waiting") {
                newStatus = "playing";
              } else if (room.status === "finished") {
                if (hasWinner) {
                  newStatus = "won";
                } else if (boardFull) {
                  newStatus = "draw";
                }
              } else if (room.status === "playing") {
                newStatus = "playing";
              }

              return {
                ...prev,
                board: room.state.board,
                currentPlayer: room.state.current_player,
                status: newStatus,
                winner: hasWinner ? (room.winner as "X" | "O") : null,
                winningLine,
                opponentName: prev.mySymbol === "X" ? room.player2_name : room.player1_name,
                matchStats: room.match_stats || prev.matchStats,
              };
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    [recordLeaderboard]
  );

  const createRoom = useCallback(async () => {
    cleanupChannel();
    await cleanupStaleRooms();
    const inviteCode = generateInviteCode();
    const mySymbol = "X";

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        game_type: "tictactoe",
        player1_name: username,
        status: "waiting",
        invite_code: inviteCode,
        state: { board: createEmptyBoard(), current_player: mySymbol },
        match_stats: DEFAULT_STATS,
      })
      .select()
      .single();

    if (error || !data) return;

    setState((prev) => ({
      ...prev,
      roomId: data.id,
      inviteCode: data.invite_code,
      mySymbol,
      status: "waiting",
      opponentName: null,
    }));

    subscribeToRoom(data.id);
  }, [username, cleanupChannel, subscribeToRoom]);

  const joinRoomByCode = useCallback(
    async (code: string) => {
      cleanupChannel();

      const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("invite_code", code.toUpperCase().trim())
        .eq("status", "waiting")
        .is("player2_name", null)
        .single();

      if (!room) return { error: "Room not found or already full" };

      const mySymbol = (room.state as { current_player: "X" | "O" }).current_player === "X" ? "O" : "X";

      const { error } = await supabase
        .from("rooms")
        .update({ player2_name: username, status: "playing" })
        .eq("id", room.id);

      if (error) return { error: error.message };

      setState((prev) => ({
        ...prev,
        roomId: room.id,
        inviteCode: room.invite_code,
        mySymbol,
        status: "playing",
        opponentName: room.player1_name,
        board: room.state.board as Board,
        currentPlayer: (room.state as { current_player: "X" | "O" }).current_player,
        matchStats: (room.match_stats as MatchStats) || DEFAULT_STATS,
      }));

      subscribeToRoom(room.id);
      return { error: null };
    },
    [username, cleanupChannel, subscribeToRoom]
  );

  const findGame = useCallback(async () => {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 500 + attempt * 300));
      }

      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("game_type", "tictactoe")
        .eq("status", "waiting")
        .is("player2_name", null)
        .neq("player1_name", username)
        .gt("created_at", cutoff)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        const result = await joinRoomByCode(data.invite_code);
        if (!result.error) return;
      }
    }

    await createRoom();
  }, [createRoom, joinRoomByCode, username]);

  const makeMove = useCallback(
    async (index: number) => {
      if (!state.roomId || !state.mySymbol || state.status !== "playing") return;
      if (state.board[index] !== null) return;
      if (state.currentPlayer !== state.mySymbol) return;

      const newBoard = [...state.board];
      newBoard[index] = state.mySymbol;

      const { winner } = checkWinner(newBoard);
      const full = isBoardFull(newBoard);

      let newStatus = "playing";
      let newWinner: string | null = null;
      const newStats = { ...state.matchStats };

      if (winner) {
        newStatus = "finished";
        newWinner = state.mySymbol;
        newStats.games_played += 1;
        if (state.mySymbol === "X") newStats.p1_wins += 1;
        else newStats.p2_wins += 1;
      } else if (full) {
        newStatus = "finished";
        newStats.games_played += 1;
        newStats.draws += 1;
      }

      await supabase
        .from("rooms")
        .update({
          state: {
            board: newBoard,
            current_player: state.mySymbol === "X" ? "O" : "X",
          },
          status: newStatus,
          winner: newWinner,
          match_stats: newStats,
        })
        .eq("id", state.roomId);
    },
    [state, username]
  );

  const playAgain = useCallback(async () => {
    if (!state.roomId || !state.mySymbol) return;

    const firstPlayer = state.winner || "X";

    await supabase
      .from("rooms")
      .update({
        state: { board: createEmptyBoard(), current_player: firstPlayer },
        status: "playing",
        winner: null,
      })
      .eq("id", state.roomId);
  }, [state.roomId, state.mySymbol, state.winner]);

  const leaveRoom = useCallback(async () => {
    if (state.roomId) {
      await supabase
        .from("rooms")
        .update({ status: "left" })
        .eq("id", state.roomId);
    }
    cleanupChannel();
    setState({
      board: createEmptyBoard(),
      currentPlayer: "X",
      mySymbol: null,
      roomId: null,
      inviteCode: null,
      status: "idle",
      winner: null,
      winningLine: null,
      opponentName: null,
      matchStats: { ...DEFAULT_STATS },
    });
  }, [state.roomId, cleanupChannel]);

  return {
    state,
    makeMove,
    findGame,
    joinRoomByCode,
    leaveRoom,
    playAgain,
  };
}
