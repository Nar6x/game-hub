"use client";

import { useState, useCallback } from "react";
import { SnakesGameState, SnakesPlayer } from "@/lib/types";

const BOARD_SIZE = 100;

const SNAKES: Record<number, number> = {
  16: 6,
  47: 26,
  49: 11,
  56: 53,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  98: 78,
};

const LADDERS: Record<number, number> = {
  1: 38,
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100,
};

const PLAYER_COLORS = ["#22d3ee", "#f43f5e", "#a78bfa", "#34d399"];

const DICE_ANIM_MS = 1000;
const SHOW_RESULT_MS = 1000;
const STEP_DELAY = 120;

function createPlayers(names: string[]): SnakesPlayer[] {
  return names.map((name, i) => ({
    name,
    position: 0,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
  }));
}

export function useSnakesGame() {
  const [state, setState] = useState<SnakesGameState>({
    players: [],
    currentPlayerIndex: 0,
    diceValue: null,
    diceRolling: false,
    gameStatus: "waiting_for_players",
    winner: null,
    message: "Add players to start",
  });

  const [playerInputs, setPlayerInputs] = useState<string[]>(["", ""]);

  const addPlayer = useCallback(() => {
    setPlayerInputs((prev) => [...prev, ""]);
  }, []);

  const removePlayer = useCallback(() => {
    setPlayerInputs((prev) => (prev.length > 2 ? prev.slice(0, -1) : prev));
  }, []);

  const updatePlayerName = useCallback((index: number, name: string) => {
    setPlayerInputs((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }, []);

  const startGame = useCallback(() => {
    const validNames = playerInputs.filter((n) => n.trim().length >= 1);
    if (validNames.length < 2) return;

    const firstPlayer = Math.floor(Math.random() * validNames.length);

    setState({
      players: createPlayers(validNames.map((n) => n.trim())),
      currentPlayerIndex: firstPlayer,
      diceValue: null,
      diceRolling: false,
      gameStatus: "rolling",
      winner: null,
      message: `${validNames[firstPlayer].trim()}'s turn to roll`,
    });
  }, [playerInputs]);

  const rollDice = useCallback(() => {
    if (state.gameStatus !== "rolling") return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const playerIdx = state.currentPlayerIndex;

    // Start dice rolling immediately
    setState((prev) => ({
      ...prev,
      diceValue,
      diceRolling: true,
      message: "Rolling...",
    }));

    // Wait for dice animation (1s) + 1s showing result, then move
    setTimeout(() => {
      setState((prev) => ({ ...prev, diceRolling: false }));
      const currentPlayerState = state.players[playerIdx];
      let targetPos = currentPlayerState.position + diceValue;

      if (targetPos > BOARD_SIZE) {
        targetPos = currentPlayerState.position;
      }

      let step = currentPlayerState.position;
      const steps: number[] = [];
      while (step < targetPos) {
        step++;
        steps.push(step);
      }

      // Start movement
      setState((prev) => ({
        ...prev,
        message: `Rolled a ${diceValue}!`,
        gameStatus: "moving",
      }));

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep >= steps.length) {
          clearInterval(interval);

          setTimeout(() => {
            setState((prev) => {
              const landedOnSnake = SNAKES[targetPos] !== undefined;
              const landedOnLadder = LADDERS[targetPos] !== undefined;
              const finalPos = landedOnSnake ? SNAKES[targetPos] : landedOnLadder ? LADDERS[targetPos] : targetPos;

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
              } else if (landedOnSnake) {
                message = `${newPlayers[playerIdx].name} hit a snake! Slid down to ${finalPos}`;
              } else if (landedOnLadder) {
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
          }, SHOW_RESULT_MS);

          return;
        }

        setState((prev) => {
          const newPlayers = prev.players.map((p, i) =>
            i === playerIdx ? { ...p, position: steps[currentStep] } : p
          );
          return { ...prev, players: newPlayers };
        });

        currentStep++;
      }, STEP_DELAY);
    }, DICE_ANIM_MS);
  }, [state]);

  const resetGame = useCallback(() => {
    setState((prev) => {
      const firstPlayer = Math.floor(Math.random() * prev.players.length);
      return {
        ...prev,
        players: prev.players.map((p) => ({ ...p, position: 0 })),
        currentPlayerIndex: firstPlayer,
        diceValue: null,
        diceRolling: false,
        gameStatus: "rolling",
        winner: null,
        message: `${prev.players[firstPlayer]?.name}'s turn to roll`,
      };
    });
  }, []);

  const backToSetup = useCallback(() => {
    setState({
      players: [],
      currentPlayerIndex: 0,
      diceValue: null,
      diceRolling: false,
      gameStatus: "waiting_for_players",
      winner: null,
      message: "Add players to start",
    });
  }, []);

  return {
    state,
    playerInputs,
    addPlayer,
    removePlayer,
    updatePlayerName,
    startGame,
    rollDice,
    resetGame,
    backToSetup,
  };
}
