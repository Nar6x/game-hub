import { Board, Player, Difficulty } from "@/lib/types";

export const WINNING_COMBOS: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createEmptyBoard(): Board {
  return Array(9).fill(null);
}

export function checkWinner(board: Board): {
  winner: Player | null;
  winningLine: number[] | null;
} {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, winningLine: combo };
    }
  }
  return { winner: null, winningLine: null };
}

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export function getAvailableMoves(board: Board): number[] {
  return board.reduce<number[]>((moves, cell, index) => {
    if (cell === null) moves.push(index);
    return moves;
  }, []);
}

function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  humanPlayer: Player
): number {
  const { winner } = checkWinner(board);

  if (winner === aiPlayer) return 10 - depth;
  if (winner === humanPlayer) return depth - 10;
  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    const availableMoves = getAvailableMoves(board);
    for (const move of availableMoves) {
      board[move] = aiPlayer;
      const score = minimax(board, depth + 1, false, aiPlayer, humanPlayer);
      board[move] = null;
      bestScore = Math.max(score, bestScore);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    const availableMoves = getAvailableMoves(board);
    for (const move of availableMoves) {
      board[move] = humanPlayer;
      const score = minimax(board, depth + 1, true, aiPlayer, humanPlayer);
      board[move] = null;
      bestScore = Math.min(score, bestScore);
    }
    return bestScore;
  }
}

function getMinimaxMove(board: Board, aiPlayer: Player): number {
  const humanPlayer = aiPlayer === "X" ? "O" : "X";
  let bestScore = -Infinity;
  let bestMove = -1;
  const availableMoves = getAvailableMoves(board);

  for (const move of availableMoves) {
    board[move] = aiPlayer;
    const score = minimax(board, 0, false, aiPlayer, humanPlayer);
    board[move] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function getMediumMove(board: Board, aiPlayer: Player): number {
  if (Math.random() < 0.5) {
    return getMinimaxMove(board, aiPlayer);
  }

  const availableMoves = getAvailableMoves(board);

  const humanPlayer = aiPlayer === "X" ? "O" : "X";

  for (const move of availableMoves) {
    board[move] = aiPlayer;
    const { winner } = checkWinner(board);
    board[move] = null;
    if (winner === aiPlayer) return move;
  }

  for (const move of availableMoves) {
    board[move] = humanPlayer;
    const { winner } = checkWinner(board);
    board[move] = null;
    if (winner === humanPlayer) return move;
  }

  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  if (board[4] === null) return 4;

  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function getRandomMove(board: Board): number {
  const availableMoves = getAvailableMoves(board);
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

export function getAIMove(
  board: Board,
  aiPlayer: Player,
  difficulty: Difficulty
): number {
  switch (difficulty) {
    case "hard":
      return getMinimaxMove(board, aiPlayer);
    case "medium":
      return getMediumMove(board, aiPlayer);
    case "easy":
      return getRandomMove(board);
  }
}
