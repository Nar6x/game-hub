"use client";

import { useState } from "react";
import { useUser } from "@/components/shared/UserContext";
import { PageTransition } from "@/components/shared/PageTransition";
import { useSnakesGame } from "@/hooks/useSnakesGame";
import { useOnlineSnakes } from "@/hooks/useOnlineSnakes";
import { SnakesBoard } from "@/components/snakes/SnakesBoard";
import { Dice } from "@/components/snakes/Dice";
import { PlayerSetup } from "@/components/snakes/PlayerSetup";
import { OnlineSnakesLobby } from "@/components/snakes/OnlineSnakesLobby";

type PageMode = "menu" | "local" | "online";

export default function SnakesAndLaddersPage() {
  const { username } = useUser();
  const local = useSnakesGame();
  const online = useOnlineSnakes();
  const [pageMode, setPageMode] = useState<PageMode>("menu");

  const isOnline = pageMode === "online" || online.state.gameStatus !== "idle";

  if (isOnline) {
    if (online.state.gameStatus === "idle" || online.state.gameStatus === "waiting") {
      return (
        <PageTransition>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <OnlineSnakesLobby
            username={username}
            inviteCode={online.state.inviteCode}
            maxPlayers={online.state.maxPlayers}
            onCreateRoom={online.createRoom}
            onJoinByCode={online.joinRoomByCode}
            onBack={() => {
              setPageMode("menu");
              online.leaveRoom();
            }}
          />
        </main>
        </PageTransition>
      );
    }

    if (online.state.gameStatus === "opponent_left") {
      return (
        <PageTransition>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            <div className="text-center space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Player Disconnected
              </h1>
              <p className="text-sm text-gray-400">A player has left the game</p>
            </div>
            <button
              onClick={() => {
                online.leaveRoom();
                setPageMode("menu");
              }}
              className="
                px-8 py-3 rounded-xl font-medium
                bg-gradient-to-r from-emerald-500 to-cyan-500
                hover:from-emerald-400 hover:to-cyan-400
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

    return (
      <PageTransition>
      <main className="flex-1 flex flex-col items-center p-4 sm:p-6">
        <div className="w-full max-w-5xl flex flex-col items-center gap-6 sm:gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Snakes & Ladders
            </h1>
            <p className="text-sm text-gray-400 min-h-[20px]">{online.state.message}</p>
            {online.state.inviteCode && (
              <p className="text-xs text-gray-600 font-mono tracking-wider">Room: {online.state.inviteCode}</p>
            )}
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-6 w-full justify-center">
            <div className="flex-1 flex justify-center min-w-0">
              <SnakesBoard players={online.state.players} />
            </div>

            <div className="w-full lg:w-56 flex flex-col items-center gap-5">
              <div className="w-full space-y-2">
                {online.state.players.map((player, i) => (
                  <div
                    key={player.name}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-300 border
                      ${
                        i === online.state.currentPlayerIndex && online.state.gameStatus !== "won"
                          ? "bg-gray-800/80 border-gray-600 scale-[1.02] shadow-lg"
                          : "bg-gray-900/40 border-gray-800/50 opacity-60"
                      }
                    `}
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{
                        backgroundColor: player.color,
                        boxShadow: `0 0 0 2px ${player.color}`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{player.name}</div>
                      <div className="text-xs text-gray-500">Square {player.position}</div>
                    </div>
                    {i === online.state.currentPlayerIndex && online.state.gameStatus !== "won" && (
                      <div className="text-xs text-emerald-400 font-medium">
                        {i === online.state.myIndex ? "YOUR TURN" : "ROLLING"}
                      </div>
                    )}
                    {player.name === username && (
                      <div className="text-xs text-cyan-400">(you)</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="py-2">
                <Dice value={online.state.diceValue} rolling={online.state.diceRolling} />
              </div>

              <div className="flex gap-3 w-full">
                {online.state.gameStatus === "rolling" && online.state.currentPlayerIndex === online.state.myIndex && (
                  <button
                    onClick={online.rollDice}
                    className="
                      flex-1 py-3.5 rounded-xl font-semibold text-sm
                      bg-gradient-to-r from-emerald-500 to-cyan-500
                      hover:from-emerald-400 hover:to-cyan-400
                      text-white shadow-lg shadow-emerald-500/20
                      transition-all duration-200
                      active:scale-95
                    "
                  >
                    Roll Dice
                  </button>
                )}

                {online.state.gameStatus === "rolling" && online.state.currentPlayerIndex !== online.state.myIndex && (
                  <div className="flex-1 py-3.5 rounded-xl text-center text-sm text-gray-500 bg-gray-800/40 border border-gray-700/50">
                    Waiting for opponent...
                  </div>
                )}

                {online.state.gameStatus === "won" && (
                  <>
                    <button
                      onClick={online.playAgain}
                      className="
                        flex-1 py-3 rounded-xl font-medium text-sm
                        bg-emerald-500 hover:bg-emerald-400
                        text-white transition-all
                      "
                    >
                      Play Again
                    </button>
                    <button
                      onClick={() => {
                        online.leaveRoom();
                        setPageMode("menu");
                      }}
                      className="
                        flex-1 py-3 rounded-xl font-medium text-sm
                        bg-gray-700 hover:bg-gray-600
                        text-white transition-all
                      "
                    >
                      Leave
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      </PageTransition>
    );
  }

  if (pageMode === "local") {
    return (
      <PageTransition>
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl flex flex-col items-center gap-6 sm:gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Snakes & Ladders
            </h1>
            <p className="text-sm text-gray-400 min-h-[20px]">{local.state.message}</p>
          </div>

          {local.state.gameStatus === "waiting_for_players" && (
            <>
              <PlayerSetup
                playerInputs={local.playerInputs}
                onAddPlayer={local.addPlayer}
                onRemovePlayer={local.removePlayer}
                onUpdateName={local.updatePlayerName}
                onStart={local.startGame}
              />
              <button
                onClick={() => setPageMode("menu")}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Back to Menu
              </button>
            </>
          )}

          {(local.state.gameStatus === "rolling" ||
            local.state.gameStatus === "moving" ||
            local.state.gameStatus === "won") && (
            <div className="flex flex-col lg:flex-row items-start gap-6 w-full justify-center">
              <div className="flex-1 flex justify-center min-w-0">
                <SnakesBoard players={local.state.players} />
              </div>

              <div className="w-full lg:w-56 flex flex-col items-center gap-5">
                <div className="w-full space-y-2">
                  {local.state.players.map((player, i) => (
                    <div
                      key={player.name}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-300 border
                        ${
                          i === local.state.currentPlayerIndex && local.state.gameStatus !== "won"
                            ? "bg-gray-800/80 border-gray-600 scale-[1.02] shadow-lg"
                            : "bg-gray-900/40 border-gray-800/50 opacity-60"
                        }
                      `}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-gray-900"
                        style={{
                          backgroundColor: player.color,
                          boxShadow: `0 0 0 2px ${player.color}`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{player.name}</div>
                        <div className="text-xs text-gray-500">Square {player.position}</div>
                      </div>
                      {i === local.state.currentPlayerIndex && local.state.gameStatus !== "won" && (
                        <div className="text-xs text-emerald-400 font-medium">ROLLING</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="py-2">
                  <Dice value={local.state.diceValue} rolling={local.state.diceRolling} />
                </div>

                <div className="flex gap-3 w-full">
                  {local.state.gameStatus === "rolling" && (
                    <button
                      onClick={local.rollDice}
                      className="
                        flex-1 py-3.5 rounded-xl font-semibold text-sm
                        bg-gradient-to-r from-emerald-500 to-cyan-500
                        hover:from-emerald-400 hover:to-cyan-400
                        text-white shadow-lg shadow-emerald-500/20
                        transition-all duration-200
                        active:scale-95
                      "
                    >
                      Roll Dice
                    </button>
                  )}

                  {local.state.gameStatus === "won" && (
                    <>
                      <button
                        onClick={local.resetGame}
                        className="
                          flex-1 py-3 rounded-xl font-medium text-sm
                          bg-emerald-500 hover:bg-emerald-400
                          text-white transition-all
                        "
                      >
                        Play Again
                      </button>
                      <button
                        onClick={local.backToSetup}
                        className="
                          flex-1 py-3 rounded-xl font-medium text-sm
                          bg-gray-700 hover:bg-gray-600
                          text-white transition-all
                        "
                      >
                        New Game
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {local.state.gameStatus === "rolling" && (
            <button
              onClick={local.backToSetup}
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

  return (
    <PageTransition>
    <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Snakes & Ladders
          </h1>
          <p className="text-sm text-gray-400">Choose a mode to start</p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => setPageMode("local")}
            className="
              w-full py-4 rounded-xl font-medium
              bg-gradient-to-r from-emerald-500 to-cyan-500
              hover:from-emerald-400 hover:to-cyan-400
              text-white transition-all duration-200
              active:scale-[0.98]
            "
          >
            Local Game
          </button>

          <button
            onClick={() => setPageMode("online")}
            className="
              w-full py-4 rounded-xl font-medium
              bg-gray-800/60 border border-gray-700/50
              text-gray-300 hover:text-white hover:border-gray-600
              transition-all duration-200
              active:scale-[0.98]
            "
          >
            Online Game
          </button>
        </div>
      </div>
    </main>
    </PageTransition>
  );
}
