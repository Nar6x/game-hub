"use client";

import { useUser } from "@/components/shared/UserContext";
import { PageTransition } from "@/components/shared/PageTransition";
import { Board } from "@/components/tictactoe/Board";
import { GameStatus } from "@/components/tictactoe/GameStatus";
import { GameControls } from "@/components/tictactoe/GameControls";
import { ScoreBoard } from "@/components/tictactoe/ScoreBoard";
import { ModeSelector } from "@/components/tictactoe/ModeSelector";
import { OnlineLobby } from "@/components/tictactoe/OnlineLobby";
import { useGameState } from "@/hooks/useGameState";
import { useOnlineGame } from "@/hooks/useOnlineGame";

export default function TicTacToePage() {
  const { username } = useUser();
  const local = useGameState();
  const online = useOnlineGame();

  const isOnline = local.state.gameMode === "online";

  const handleSelect = (mode: "pvp" | "pve", difficulty?: "easy" | "medium" | "hard") => {
    local.startGame(mode, difficulty);
  };

  const handleOnline = () => {
    local.startGame("online");
  };

  if (local.state.gameStatus === "idle" && !isOnline) {
    return (
      <PageTransition>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg flex flex-col items-center gap-6 sm:gap-8">
          <ModeSelector onSelect={handleSelect} onOnline={handleOnline} />
        </div>
      </main>
      </PageTransition>
    );
  }

  if (isOnline && online.state.status === "idle") {
    return (
      <PageTransition>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg flex flex-col items-center gap-6">
          <OnlineLobby
            username={username}
            inviteCode={online.state.inviteCode}
            onCreateRoom={online.findGame}
            onJoinByCode={online.joinRoomByCode}
            onBack={() => local.resetGame()}
          />
        </div>
      </main>
      </PageTransition>
    );
  }

  if (isOnline && online.state.status === "opponent_left") {
    return (
      <PageTransition>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg flex flex-col items-center gap-6">
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
              Opponent Left
            </h1>
            <p className="text-sm text-gray-400">The other player has disconnected</p>
          </div>
          <button
            onClick={() => {
              online.leaveRoom();
            }}
            className="
              px-8 py-3 rounded-xl font-medium
              bg-gradient-to-r from-cyan-500 to-rose-500
              hover:from-cyan-400 hover:to-rose-400
              text-white transition-all
            "
          >
            Back to Lobby
          </button>
        </div>
      </main>
      </PageTransition>
    );
  }

  if (isOnline && online.state.status !== "idle") {
    const ms = online.state.matchStats;
    return (
      <PageTransition>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg flex flex-col items-center gap-6 sm:gap-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
              Tic Tac Toe
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Online{online.state.opponentName ? ` vs ${online.state.opponentName}` : " - Waiting for opponent..."}
            </p>
            {online.state.inviteCode && (
              <p className="text-xs text-gray-600 mt-1 font-mono tracking-wider">
                Room: {online.state.inviteCode}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className={`flex flex-col items-center px-4 sm:px-6 py-3 rounded-xl bg-gray-800/50 border border-cyan-400/30 ${online.state.mySymbol === "X" ? "scale-105 shadow-lg" : "opacity-70"}`}>
              <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider">
                {username} ({online.state.mySymbol})
              </span>
            </div>
            <div className={`flex flex-col items-center px-4 sm:px-6 py-3 rounded-xl bg-gray-800/50 border border-rose-400/30 ${online.state.mySymbol === "O" ? "scale-105 shadow-lg" : "opacity-70"}`}>
              <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider">
                {online.state.opponentName || "..."} ({online.state.mySymbol === "X" ? "O" : "X"})
              </span>
            </div>
          </div>

          {ms.games_played > 0 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-gray-800/30">
                <span className="text-xs text-gray-500">W</span>
                <span className="font-bold text-cyan-400">{ms.p1_wins}</span>
              </div>
              <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-gray-800/30">
                <span className="text-xs text-gray-500">D</span>
                <span className="font-bold text-gray-400">{ms.draws}</span>
              </div>
              <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-gray-800/30">
                <span className="text-xs text-gray-500">W</span>
                <span className="font-bold text-rose-400">{ms.p2_wins}</span>
              </div>
              <span className="text-xs text-gray-600 ml-1">/ {ms.games_played} games</span>
            </div>
          )}

          <GameStatus
            status={online.state.status === "waiting" ? "idle" : online.state.status === "playing" ? "playing" : online.state.status === "won" ? "won" : "draw"}
            currentPlayer={online.state.currentPlayer}
            winner={online.state.winner}
            gameMode="pvp"
          />

          <Board
            board={online.state.board}
            onCellClick={online.makeMove}
            winningLine={online.state.winningLine}
            disabled={
              online.state.status !== "playing" ||
              online.state.currentPlayer !== online.state.mySymbol
            }
          />

          {online.state.status === "won" || online.state.status === "draw" ? (
            <div className="flex gap-4">
              <button
                onClick={online.playAgain}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:scale-105 transition-all"
              >
                Play Again
              </button>
              <button
                onClick={online.leaveRoom}
                className="px-6 py-3 rounded-xl bg-gray-700 text-gray-300 font-semibold hover:bg-gray-600 transition-all"
              >
                Leave
              </button>
            </div>
          ) : (
            <button
              onClick={online.leaveRoom}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Leave Game
            </button>
          )}
        </div>
      </main>
      </PageTransition>
    );
  }

  const currentScores = local.state.scores[local.state.gameMode];

  return (
    <PageTransition>
    <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg flex flex-col items-center gap-6 sm:gap-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
            Tic Tac Toe
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {local.state.gameMode === "pve" ? "vs AI" : "vs Player"}
          </p>
        </div>

        <ScoreBoard
          scores={currentScores}
          currentPlayer={local.state.currentPlayer}
          gameMode={local.state.gameMode}
          difficulty={local.state.difficulty}
        />

        <GameStatus
          status={local.state.gameStatus}
          currentPlayer={local.state.currentPlayer}
          winner={local.state.winner}
          gameMode={local.state.gameMode}
          difficulty={local.state.difficulty}
        />

        <Board
          board={local.state.board}
          onCellClick={local.makeMove}
          winningLine={local.state.winningLine}
          disabled={
            local.state.gameStatus !== "playing" ||
            (local.state.gameMode === "pve" && local.state.currentPlayer === "O")
          }
        />

        {(local.state.gameStatus === "won" || local.state.gameStatus === "draw") && (
          <GameControls
            onPlayAgain={local.playAgain}
            onBackToMenu={local.resetGame}
            onResetScores={local.resetScores}
          />
        )}

        {local.state.gameStatus === "playing" && (
          <button
            onClick={local.resetGame}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Back to Menu
          </button>
        )}
      </div>
    </main>
    </PageTransition>
  );
}
