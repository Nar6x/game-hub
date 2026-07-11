"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/components/shared/UserContext";
import { SnakesPlayer } from "@/lib/types";
import { RealtimeChannel } from "@supabase/supabase-js";

const BOARD_SIZE = 100;

const SNAKES: Record<number, number> = {
  16: 6, 47: 26, 49: 11, 56: 53, 62: 19,
  64: 60, 87: 24, 93: 73, 95: 75, 98: 78,
};

const LADDERS: Record<number, number> = {
  1: 38, 4: 14, 9: 31, 21: 42, 28: 84,
  36: 44, 51: 67, 71: 91, 80: 100,
};

const PLAYER_COLORS = ["#22d3ee", "#f43f5e", "#a78bfa", "#34d399"];
const STALE_MINUTES = 5;
const STEP_DELAY = 100;
const DICE_ANIM_MS = 1000;
const SHOW_RESULT_MS = 1000;

interface SnakesRoomState {
  players: SnakesPlayer[];
  currentPlayerIndex: number;
  diceValue: number | null;
  gameStatus: "waiting" | "rolling" | "moving" | "won";
  winner: string | null;
}

interface OnlineSnakesState {
  players: SnakesPlayer[];
  currentPlayerIndex: number;
  diceValue: number | null;
  gameStatus: "idle" | "waiting" | "rolling" | "moving" | "won" | "opponent_left";
  myIndex: number | null;
  roomId: string | null;
  inviteCode: string | null;
  winner: string | null;
  message: string;
  maxPlayers: number;
  diceRolling: boolean;
}

const DEFAULT_ROOM_STATE: SnakesRoomState = {
  players: [],
  currentPlayerIndex: 0,
  diceValue: null,
  gameStatus: "waiting",
  winner: null,
};

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function cleanupStaleRooms() {
  const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();
  await supabase
    .from("rooms")
    .delete()
    .in("status", ["waiting", "playing"])
    .lt("created_at", cutoff);
}

export function useOnlineSnakes() {
  const { username } = useUser();
  const [state, setState] = useState<OnlineSnakesState>({
    players: [],
    currentPlayerIndex: 0,
    diceValue: null,
    gameStatus: "idle",
    myIndex: null,
    roomId: null,
    inviteCode: null,
    winner: null,
    message: "",
    maxPlayers: 2,
    diceRolling: false,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const processingRef = useRef(false);

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
        .channel(`snakes:${roomId}`)
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
                gameStatus: "opponent_left",
              }));
              return;
            }

            if (processingRef.current) return;

            const room = payload.new as {
              state: SnakesRoomState;
              player1_name: string;
              player2_name: string | null;
              status: string;
              winner: string | null;
              players_info: SnakesPlayer[];
              max_players: number;
            };

            const roomState = room.state || DEFAULT_ROOM_STATE;

            setState((prev) => {
              const myIndex = prev.myIndex;
              const isMyTurn = myIndex !== null && roomState.currentPlayerIndex === myIndex;

              let newStatus: OnlineSnakesState["gameStatus"] = prev.gameStatus;

              if (room.status === "playing" && prev.gameStatus === "waiting") {
                newStatus = "rolling";
              } else if (roomState.gameStatus === "won") {
                newStatus = "won";
              } else if (roomState.gameStatus === "rolling") {
                newStatus = isMyTurn ? "rolling" : "moving";
              } else if (roomState.gameStatus === "waiting") {
                newStatus = "waiting";
              }

              let message = "";
              if (newStatus === "waiting") {
                message = `Waiting for players (${roomState.players.length}/${room.max_players || 2})`;
              } else if (newStatus === "won") {
                message = `${roomState.winner} wins!`;
              } else if (isMyTurn) {
                message = "Your turn to roll";
              } else {
                const current = roomState.players[roomState.currentPlayerIndex];
                message = `${current?.name || "..."}'s turn`;
              }

              return {
                ...prev,
                players: roomState.players.length > 0 ? roomState.players : (room.players_info || []),
                currentPlayerIndex: roomState.currentPlayerIndex,
                diceValue: roomState.diceValue,
                gameStatus: newStatus,
                winner: roomState.winner,
                message,
                maxPlayers: room.max_players || 2,
              };
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    []
  );

  const createRoom = useCallback(
    async (playerCount: number) => {
      cleanupChannel();
      await cleanupStaleRooms();
      const inviteCode = generateInviteCode();
      const myPlayer: SnakesPlayer = { name: username, position: 0, color: PLAYER_COLORS[0] };

      const roomState: SnakesRoomState = {
        players: [myPlayer],
        currentPlayerIndex: 0,
        diceValue: null,
        gameStatus: "waiting",
        winner: null,
      };

      const { data, error } = await supabase
        .from("rooms")
        .insert({
          game_type: "snakes",
          player1_name: username,
          status: "waiting",
          invite_code: inviteCode,
          max_players: playerCount,
          players_info: [myPlayer],
          state: roomState,
        })
        .select()
        .single();

      if (error || !data) return;

      setState((prev) => ({
        ...prev,
        roomId: data.id,
        inviteCode: data.invite_code,
        myIndex: 0,
        players: [myPlayer],
        gameStatus: "waiting",
        maxPlayers: playerCount,
        message: `Waiting for players (${1}/${playerCount})`,
      }));

      subscribeToRoom(data.id);
    },
    [username, cleanupChannel, subscribeToRoom]
  );

  const joinRoomByCode = useCallback(
    async (code: string) => {
      cleanupChannel();

      const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("invite_code", code.toUpperCase().trim())
        .eq("game_type", "snakes")
        .eq("status", "waiting")
        .maybeSingle();

      if (!room) return { error: "Room not found" };

      const currentState = (room.state as SnakesRoomState) || DEFAULT_ROOM_STATE;
      const playerCount = currentState.players.length;

      if (playerCount >= room.max_players) return { error: "Room is full" };

      const playerIndex = playerCount;
      const myPlayer: SnakesPlayer = {
        name: username,
        position: 0,
        color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
      };

      const updatedPlayers = [...currentState.players, myPlayer];
      const newStatus = updatedPlayers.length >= room.max_players ? "playing" : "waiting";
      const firstPlayer = Math.floor(Math.random() * updatedPlayers.length);

      const { error } = await supabase
        .from("rooms")
        .update({
          player2_name: playerCount === 1 ? username : room.player2_name,
          status: newStatus,
          players_info: updatedPlayers,
          state: {
            ...currentState,
            players: updatedPlayers,
            currentPlayerIndex: newStatus === "playing" ? firstPlayer : currentState.currentPlayerIndex,
            gameStatus: newStatus === "playing" ? "rolling" : "waiting",
          },
        })
        .eq("id", room.id);

      if (error) return { error: error.message };

      setState((prev) => ({
        ...prev,
        roomId: room.id,
        inviteCode: room.invite_code,
        myIndex: playerIndex,
        players: updatedPlayers,
        currentPlayerIndex: newStatus === "playing" ? firstPlayer : currentState.currentPlayerIndex,
        gameStatus: newStatus === "playing" ? "rolling" : "waiting",
        maxPlayers: room.max_players,
        message: newStatus === "playing"
          ? `${updatedPlayers[firstPlayer]?.name}'s turn to roll`
          : `Waiting for players (${updatedPlayers.length}/${room.max_players})`,
      }));

      subscribeToRoom(room.id);
      return { error: null };
    },
    [username, cleanupChannel, subscribeToRoom]
  );

  const rollDice = useCallback(async () => {
    if (!state.roomId || state.gameStatus !== "rolling" || state.myIndex === null) return;
    if (state.currentPlayerIndex !== state.myIndex) return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const currentState = state.players[state.myIndex];
    let targetPos = currentState.position + diceValue;
    if (targetPos > BOARD_SIZE) targetPos = currentState.position;

    let step = currentState.position;
    const steps: number[] = [];
    while (step < targetPos) {
      step++;
      steps.push(step);
    }

    processingRef.current = true;

    // Start dice rolling immediately
    setState((prev) => ({ ...prev, diceValue, diceRolling: true, message: "Rolling..." }));

    // Wait for dice animation (1s)
    await new Promise((r) => setTimeout(r, DICE_ANIM_MS));

    // Wait 1s showing result before movement
    setState((prev) => ({ ...prev, diceRolling: false, message: `Rolled a ${diceValue}!` }));
    await new Promise((r) => setTimeout(r, SHOW_RESULT_MS));

    // Start movement
    setState((prev) => ({ ...prev, gameStatus: "moving" }));

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, STEP_DELAY));
      const updatedPlayers = state.players.map((p, idx) =>
        idx === state.myIndex ? { ...p, position: steps[i] } : p
      );
      setState((prev) => ({ ...prev, players: updatedPlayers }));
    }

    // Show final position briefly
    await new Promise((r) => setTimeout(r, SHOW_RESULT_MS));

    // Calculate final state and send ONE update to Supabase
    const landedOnSnake = SNAKES[targetPos] !== undefined;
    const landedOnLadder = LADDERS[targetPos] !== undefined;
    const finalPos = landedOnSnake ? SNAKES[targetPos] : landedOnLadder ? LADDERS[targetPos] : targetPos;

    const finalPlayers = state.players.map((p, idx) =>
      idx === state.myIndex ? { ...p, position: finalPos } : p
    );

    const isWinner = finalPos === BOARD_SIZE;
    const nextIdx = (state.myIndex + 1) % finalPlayers.length;

    await supabase
      .from("rooms")
      .update({
        state: {
          players: finalPlayers,
          currentPlayerIndex: isWinner ? state.myIndex : nextIdx,
          diceValue,
          gameStatus: isWinner ? "won" : "rolling",
          winner: isWinner ? username : null,
        },
        winner: isWinner ? username : null,
        status: isWinner ? "finished" : "playing",
      })
      .eq("id", state.roomId);

    processingRef.current = false;
  }, [state, username]);

  const leaveRoom = useCallback(async () => {
    if (state.roomId) {
      await supabase.from("rooms").delete().eq("id", state.roomId);
    }
    cleanupChannel();
    setState({
      players: [],
      currentPlayerIndex: 0,
      diceValue: null,
      gameStatus: "idle",
      myIndex: null,
      roomId: null,
      inviteCode: null,
      winner: null,
      message: "",
      maxPlayers: 2,
      diceRolling: false,
    });
  }, [state.roomId, cleanupChannel]);

  const playAgain = useCallback(async () => {
    if (!state.roomId) return;

    const resetPlayers = state.players.map((p) => ({ ...p, position: 0 }));
    const winnerIndex = state.players.findIndex((p) => p.name === state.winner);
    const firstPlayer = winnerIndex >= 0 ? winnerIndex : Math.floor(Math.random() * resetPlayers.length);

    await supabase
      .from("rooms")
      .update({
        state: {
          players: resetPlayers,
          currentPlayerIndex: firstPlayer,
          diceValue: null,
          gameStatus: "rolling",
          winner: null,
        },
        status: "playing",
        winner: null,
      })
      .eq("id", state.roomId);
  }, [state.roomId, state.players, state.winner]);

  return {
    state,
    createRoom,
    joinRoomByCode,
    rollDice,
    leaveRoom,
    playAgain,
  };
}
