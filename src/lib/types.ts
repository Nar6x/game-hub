export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[];
export type Difficulty = "easy" | "medium" | "hard";
export type GameStatus = "idle" | "playing" | "won" | "draw";
export type GameMode = "pvp" | "pve" | "online";

export interface Scores {
  X: number;
  O: number;
  draws: number;
}

export interface ModeScores {
  pvp: Scores;
  pve: Scores;
  online: Scores;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  gameMode: GameMode;
  difficulty: Difficulty;
  gameStatus: GameStatus;
  winner: Player | null;
  winningLine: number[] | null;
  scores: ModeScores;
  moveHistory: number[];
}

export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export type GameType = "tictactoe" | "snakes";

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  game_type: GameType;
  wins: number;
  losses: number;
  draws: number;
  created_at: string;
}

export interface MatchStats {
  p1_wins: number;
  p2_wins: number;
  draws: number;
  games_played: number;
}

export interface Room {
  id: string;
  game_type: GameType;
  player1_name: string;
  player2_name: string | null;
  status: "waiting" | "playing" | "finished";
  state: Record<string, unknown>;
  winner: string | null;
  invite_code: string | null;
  max_players: number;
  players_info: SnakesPlayer[];
  match_stats: MatchStats;
  created_at: string;
}

export interface SnakesPlayer {
  name: string;
  position: number;
  color: string;
}

export interface SnakesGameState {
  players: SnakesPlayer[];
  currentPlayerIndex: number;
  diceValue: number | null;
  gameStatus: "waiting" | "rolling" | "moving" | "won" | "waiting_for_players";
  winner: string | null;
  message: string;
}
