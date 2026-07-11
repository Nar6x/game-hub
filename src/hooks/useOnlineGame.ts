"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/components/shared/UserContext";
import { Board, MatchStats } from "@/lib/types";
import { checkWinner, isBoardFull, createEmptyBoard } from "@/lib/gameLogic/tictactoe";
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
    .in("status", ["waiting", "playing"])
    .lt("created_at", cutoff);
}

function applyRoomUpdate(
  prev: OnlineGameState,
  room: {
    state: { board: Board; current_player: "X" | "O" };
    player1_name: string;
    player2_name: string | null;
    status: string;
    winner: string | null;
    match_stats?: MatchStats;
  }
): OnlineGameState {
  const board = room.state.board;
  const hasWinner = room.winner === "X" || room.winner === "O";
  const boardFull = isBoardFull(board);

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

  const { winningLine } = hasWinner ? checkWinner(board) : { winningLine: null };

  return {
    ...prev,
    board,
    currentPlayer: room.state.current_player,
    status: newStatus,
    winner: hasWinner ? (room.winner as "X" | "O") : null,
    winningLine,
    opponentName: prev.mySymbol === "X" ? room.player2_name : room.player1_name,
    matchStats: room.match_stats || prev.matchStats,
  };
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

  useEffect(() => {
    const handleBeforeUnload = () => {
      const id = roomIdRef.current;
      if (!id) return;
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rooms?id=eq.${id}`;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
      fetch(url, {
        method: "DELETE",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        keepalive: true,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const subscribeToRoom = useCallback(
    (roomId: string) => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      roomIdRef.current = roomId;

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

            setState((prev) => applyRoomUpdate(prev, room));
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    []
  );

  const createRoom = useCallback(async () => {
    cleanupChannel();
    await cleanupStaleRooms();
    const inviteCode = generateInviteCode();
    const mySymbol = Math.random() > 0.5 ? "X" : "O";

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
    [state]
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
      await supabase.from("rooms").delete().eq("id", state.roomId);
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
