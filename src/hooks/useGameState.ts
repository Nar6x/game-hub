"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GameState, Player, GameMode, Difficulty, GameStatus, Scores } from "@/lib/types";
import {
  createEmptyBoard,
  checkWinner,
  isBoardFull,
  getAIMove,
} from "@/lib/gameLogic/tictactoe";

const initialGameState: GameState = {
  board: createEmptyBoard(),
  currentPlayer: "X",
  gameMode: "pvp",
  difficulty: "medium",
  gameStatus: "idle",
  winner: null,
  winningLine: null,
  scores: {
    pvp: { X: 0, O: 0, draws: 0 },
    pve: { X: 0, O: 0, draws: 0 },
    online: { X: 0, O: 0, draws: 0 },
  },
  moveHistory: [],
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialGameState);
  const aiThinking = useRef(false);

  const makeMove = useCallback(
    (index: number) => {
      setState((prev) => {
        if (
          prev.board[index] !== null ||
          prev.gameStatus === "won" ||
          prev.gameStatus === "draw" ||
          prev.gameStatus === "idle"
        ) {
          return prev;
        }

        const newBoard = [...prev.board];
        newBoard[index] = prev.currentPlayer;

        const { winner, winningLine } = checkWinner(newBoard);
        const boardFull = isBoardFull(newBoard);

        let newStatus: GameStatus = "playing";
        const modeScores: Scores = { ...prev.scores[prev.gameMode] };

        if (winner) {
          newStatus = "won";
          if (winner === "X") modeScores.X += 1;
          else modeScores.O += 1;
        } else if (boardFull) {
          newStatus = "draw";
          modeScores.draws += 1;
        }

        const nextPlayer: Player = prev.currentPlayer === "X" ? "O" : "X";

        return {
          ...prev,
          board: newBoard,
          currentPlayer: nextPlayer,
          gameStatus: newStatus,
          winner,
          winningLine,
          scores: { ...prev.scores, [prev.gameMode]: modeScores },
          moveHistory: [...prev.moveHistory, index],
        };
      });
    },
    []
  );

  useEffect(() => {
    if (
      state.gameMode === "pve" &&
      state.currentPlayer === "O" &&
      state.gameStatus === "playing" &&
      !aiThinking.current
    ) {
      aiThinking.current = true;

      const timeout = setTimeout(() => {
        setState((prev) => {
          if (
            prev.gameMode !== "pve" ||
            prev.currentPlayer !== "O" ||
            prev.gameStatus !== "playing"
          ) {
            aiThinking.current = false;
            return prev;
          }

          const boardCopy = [...prev.board];
          const bestMove = getAIMove(boardCopy, "O", prev.difficulty);

          if (bestMove === -1) {
            aiThinking.current = false;
            return prev;
          }

          const newBoard = [...prev.board];
          newBoard[bestMove] = "O";

          const { winner, winningLine } = checkWinner(newBoard);
          const boardFull = isBoardFull(newBoard);

          let newStatus: GameStatus = "playing";
          const modeScores: Scores = { ...prev.scores[prev.gameMode] };

          if (winner) {
            newStatus = "won";
            if (winner === "X") modeScores.X += 1;
            else modeScores.O += 1;
          } else if (boardFull) {
            newStatus = "draw";
            modeScores.draws += 1;
          }

          aiThinking.current = false;

          return {
            ...prev,
            board: newBoard,
            currentPlayer: "X",
            gameStatus: newStatus,
            winner,
            winningLine,
            scores: { ...prev.scores, [prev.gameMode]: modeScores },
            moveHistory: [...prev.moveHistory, bestMove],
          };
        });
      }, 400);

      return () => clearTimeout(timeout);
    }
  }, [state.gameMode, state.currentPlayer, state.gameStatus]);

  const startGame = useCallback((mode: GameMode, difficulty?: Difficulty) => {
    const firstPlayer: Player = mode === "pvp" ? (Math.random() > 0.5 ? "X" : "O") : "X";
    setState((prev) => ({
      ...prev,
      board: createEmptyBoard(),
      currentPlayer: firstPlayer,
      gameMode: mode,
      difficulty: difficulty ?? prev.difficulty,
      gameStatus: "playing",
      winner: null,
      winningLine: null,
      moveHistory: [],
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      board: createEmptyBoard(),
      currentPlayer: "X",
      gameMode: "pvp",
      gameStatus: "idle",
      winner: null,
      winningLine: null,
      moveHistory: [],
    }));
  }, []);

  const playAgain = useCallback(() => {
    setState((prev) => {
      const firstPlayer: Player = prev.gameMode === "pvp"
        ? (prev.winner ? prev.winner : (Math.random() > 0.5 ? "X" : "O"))
        : "X";
      return {
        ...prev,
        board: createEmptyBoard(),
        currentPlayer: firstPlayer,
        gameStatus: "playing",
        winner: null,
        winningLine: null,
        moveHistory: [],
      };
    });
  }, []);

  const resetScores = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [prev.gameMode]: { X: 0, O: 0, draws: 0 },
      },
    }));
  }, []);

  return {
    state,
    makeMove,
    startGame,
    resetGame,
    playAgain,
    resetScores,
  };
}
