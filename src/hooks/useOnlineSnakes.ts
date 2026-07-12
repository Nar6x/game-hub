"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/components/shared/UserContext";
import { SnakesPlayer } from "@/lib/types";
import { updateLeaderboard } from "@/lib/leaderboard";
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
const PAUSE_BEFORE_MOVE_MS = 500;
const SHOW_RESULT_MS = 1000;

interface SnakesRoomState {
  players: SnakesPlayer[];
  currentPlayerIndex: number;
  diceValue: number | null;
  gameStatus: "waiting" | "rolling" | "rolling_dice" | "moving" | "won";
  winner: string | null;
  version: number;
}

interface OnlineSnakesState {
  players: SnakesPlayer[];
  currentPlayerIndex: number;
  diceValue: number | null;
  gameStatus: "idle" | "waiting" | "rolling" | "rolling_dice" | "moving" | "won" | "opponent_left";
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
  version: 0,
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
    .in("status", ["waiting", "playing", "left"])
    .lt("created_at", cutoff);
}

function computeSteps(startPos: number, diceValue: number): number[] {
  let targetPos = startPos + diceValue;
  if (targetPos > BOARD_SIZE) targetPos = startPos;
  const steps: number[] = [];
  let step = startPos;
  while (step < targetPos) {
    step++;
    steps.push(step);
  }
  return steps;
}

function computeFinalPos(targetPos: number): number {
  if (SNAKES[targetPos] !== undefined) return SNAKES[targetPos];
  if (LADDERS[targetPos] !== undefined) return LADDERS[targetPos];
  return targetPos;
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
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animatingRef = useRef(false);
  const stateRef = useRef(state);
  const lastVersionRef = useRef(-1);
  const leaderboardRecordedRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  });

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    roomIdRef.current = null;
  }, []);

  useEffect(() => {
    cleanupStaleRooms();
    return () => {
      cleanupChannel();
      timersRef.current.forEach(clearTimeout);
    };
  }, [cleanupChannel]);

  const animateLocally = useCallback(
    (diceVal: number, playerIdx: number, startPos: number) => {
      if (animatingRef.current) return;
      animatingRef.current = true;

      const targetPos = Math.min(startPos + diceVal, BOARD_SIZE);
      const steps = computeSteps(startPos, diceVal);

      setState((prev) => ({
        ...prev,
        diceValue: diceVal,
        diceRolling: true,
        gameStatus: "rolling_dice",
        message: "Rolling...",
      }));

      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      const t1 = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          diceRolling: false,
          message: `Rolled a ${diceVal}!`,
        }));

        const t2 = setTimeout(() => {
          setState((prev) => ({ ...prev, gameStatus: "moving" }));

          let currentStep = 0;
          const interval = setInterval(() => {
            if (currentStep >= steps.length) {
              clearInterval(interval);

              const t3 = setTimeout(() => {
                const finalPos = computeFinalPos(targetPos);

                setState((prev) => {
                  const newPlayers = prev.players.map((p, i) =>
                    i === playerIdx ? { ...p, position: finalPos } : p
                  );

                  let message = "";
                  let newStatus: "rolling" | "won" = "rolling";
                  let winner: string | null = null;

                  if (finalPos === BOARD_SIZE) {
                    message = `${newPlayers[playerIdx].name} wins!`;
                    newStatus = "won";
                    winner = newPlayers[playerIdx].name;
                  } else if (SNAKES[targetPos] !== undefined) {
                    message = `${newPlayers[playerIdx].name} hit a snake! Slid down to ${finalPos}`;
                  } else if (LADDERS[targetPos] !== undefined) {
                    message = `${newPlayers[playerIdx].name} climbed a ladder! Up to ${finalPos}`;
                  }

                  const nextIdx = (playerIdx + 1) % newPlayers.length;
                  if (newStatus === "rolling") {
                    message = `${newPlayers[nextIdx].name}'s turn to roll`;
                  }

                  return {
                    ...prev,
                    players: newPlayers,
                    currentPlayerIndex: winner !== null ? playerIdx : nextIdx,
                    gameStatus: newStatus,
                    winner,
                    message,
                  };
                });

                animatingRef.current = false;
              }, SHOW_RESULT_MS);
              timersRef.current.push(t3);
              return;
            }

            const stepPos = steps[currentStep];
            setState((prev) => ({
              ...prev,
              players: prev.players.map((p, i) =>
                i === playerIdx ? { ...p, position: stepPos } : p
              ),
            }));
            currentStep++;
          }, STEP_DELAY);
        }, PAUSE_BEFORE_MOVE_MS);
        timersRef.current.push(t2);
      }, DICE_ANIM_MS);
      timersRef.current.push(t1);
    },
    []
  );

  const recordLeaderboard = useCallback(
    (winnerName: string | null, players: SnakesPlayer[]) => {
      if (leaderboardRecordedRef.current === winnerName) return;
      leaderboardRecordedRef.current = winnerName;

      const isDraw = winnerName === null;
      for (const p of players) {
        const result: "win" | "loss" | "draw" = isDraw
          ? "draw"
          : p.name === winnerName
            ? "win"
            : "loss";
        updateLeaderboard(p.name, "snakes", result);
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
              setState((prev) => ({ ...prev, gameStatus: "opponent_left" }));
              return;
            }

            const room = payload.new as {
              state: SnakesRoomState;
              player1_name: string;
              player2_name: string | null;
              status: string;
              winner: string | null;
              players_info?: SnakesPlayer[];
              max_players?: number;
            };

            if (room.status === "left") {
              setState((prev) => ({ ...prev, gameStatus: "opponent_left" }));
              return;
            }

            const roomState = room.state || DEFAULT_ROOM_STATE;
            const incomingVersion = roomState.version ?? 0;
            const isAnimating = animatingRef.current;

            const roomPlayers = roomState.players?.length > 0 ? roomState.players : room.players_info ?? [];

            if (roomState.gameStatus === "won" && !isAnimating && roomState.winner === username && roomPlayers.length > 0) {
              recordLeaderboard(roomState.winner, roomPlayers);
            }

            setState((prev) => {
              if (isAnimating) {
                if (roomState.gameStatus === "won") {
                  return {
                    ...prev,
                    gameStatus: "won",
                    winner: roomState.winner,
                    message: `${roomState.winner} wins!`,
                  };
                }
                return prev;
              }

              if (incomingVersion <= lastVersionRef.current && roomState.gameStatus !== "won") {
                return prev;
              }
              lastVersionRef.current = incomingVersion;

              const myIndex = prev.myIndex;

              if (roomState.gameStatus === "rolling_dice" && roomState.diceValue !== null) {
                const isMyRoll = roomState.currentPlayerIndex === myIndex;

                if (isMyRoll) {
                  return { ...prev, diceValue: roomState.diceValue };
                }

                animatingRef.current = true;
                const startPos = prev.players[roomState.currentPlayerIndex]?.position ?? 0;
                setTimeout(() => {
                  animateLocally(roomState.diceValue!, roomState.currentPlayerIndex, startPos);
                }, 0);
                return { ...prev, message: "Opponent is rolling..." };
              }

              if (room.status === "playing" && prev.gameStatus === "waiting") {
                const isMyTurn = myIndex !== null && roomState.currentPlayerIndex === myIndex;
                return {
                  ...prev,
                  players: roomState.players?.length > 0 ? roomState.players : room.players_info ?? [],
                  currentPlayerIndex: roomState.currentPlayerIndex,
                  diceValue: roomState.diceValue,
                  gameStatus: isMyTurn ? "rolling" : "moving",
                  winner: roomState.winner,
                  message: isMyTurn ? "Your turn to roll" : "Opponent's turn",
                  maxPlayers: room.max_players || 2,
                };
              }

              if (roomState.gameStatus === "rolling_dice") {
                return prev;
              }

              const isMyTurn = myIndex !== null && roomState.currentPlayerIndex === myIndex;
              return {
                ...prev,
                players: roomState.players?.length > 0 ? roomState.players : prev.players,
                currentPlayerIndex: roomState.currentPlayerIndex,
                diceValue: roomState.diceValue,
                gameStatus: roomState.gameStatus === "won" ? "won" : isMyTurn ? "rolling" : "moving",
                winner: roomState.winner,
                message: roomState.gameStatus === "won"
                  ? `${roomState.winner} wins!`
                  : isMyTurn
                    ? "Your turn to roll"
                    : "Opponent's turn",
                maxPlayers: room.max_players || 2,
              };
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    [animateLocally, recordLeaderboard, username]
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
        version: 0,
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

      lastVersionRef.current = -1;
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
            version: 0,
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

      lastVersionRef.current = -1;
      subscribeToRoom(room.id);
      return { error: null };
    },
    [username, cleanupChannel, subscribeToRoom]
  );

  const rollDice = useCallback(async () => {
    if (!state.roomId || state.gameStatus !== "rolling" || state.myIndex === null) return;
    if (state.currentPlayerIndex !== state.myIndex) return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const myIndex = state.myIndex;
    const startPos = state.players[myIndex].position;
    const rollVersion = (stateRef.current.roomId ? (lastVersionRef.current + 1) : 0);

    animateLocally(diceValue, myIndex, startPos);

    await supabase
      .from("rooms")
      .update({
        state: {
          currentPlayerIndex: myIndex,
          diceValue,
          gameStatus: "rolling_dice",
          winner: null,
          version: rollVersion,
        },
      })
      .eq("id", state.roomId);

    const steps = computeSteps(startPos, diceValue);
    const totalMs = DICE_ANIM_MS + PAUSE_BEFORE_MOVE_MS + (steps.length * STEP_DELAY) + SHOW_RESULT_MS + 200;
    await new Promise((r) => setTimeout(r, totalMs));

    const latestState = stateRef.current;
    const targetPos = Math.min(startPos + diceValue, BOARD_SIZE);
    const finalPos = computeFinalPos(targetPos);
    const finalPlayers = latestState.players.map((p, idx) =>
      idx === myIndex ? { ...p, position: finalPos } : p
    );
    const isWinner = finalPos === BOARD_SIZE;
    const nextIdx = (myIndex + 1) % finalPlayers.length;

    await supabase
      .from("rooms")
      .update({
        state: {
          players: finalPlayers,
          currentPlayerIndex: isWinner ? myIndex : nextIdx,
          diceValue,
          gameStatus: isWinner ? "won" : "rolling",
          winner: isWinner ? username : null,
          version: rollVersion + 1,
        },
        winner: isWinner ? username : null,
        status: isWinner ? "finished" : "playing",
      })
      .eq("id", state.roomId);
  }, [state, username, animateLocally]);

  const leaveRoom = useCallback(async () => {
    if (state.roomId) {
      await supabase
        .from("rooms")
        .update({ status: "left" })
        .eq("id", state.roomId);
    }
    cleanupChannel();
    lastVersionRef.current = -1;
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

    lastVersionRef.current = -1;

    await supabase
      .from("rooms")
      .update({
        state: {
          players: resetPlayers,
          currentPlayerIndex: firstPlayer,
          diceValue: null,
          gameStatus: "rolling",
          winner: null,
          version: 0,
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
