"use client";

import { useState } from "react";
import { Spinner } from "@/components/shared/Spinner";

interface OnlineSnakesLobbyProps {
  username: string;
  inviteCode: string | null;
  maxPlayers: number;
  onCreateRoom: (playerCount: number) => void;
  onJoinByCode: (code: string) => Promise<{ error: string | null }>;
  onBack: () => void;
}

export function OnlineSnakesLobby({
  inviteCode,
  maxPlayers,
  onCreateRoom,
  onJoinByCode,
  onBack,
}: OnlineSnakesLobbyProps) {
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setError("");

    const result = await onJoinByCode(joinCode);
    if (result.error) {
      setError(result.error);
      setIsJoining(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    onCreateRoom(playerCount);
  };

  const copyCode = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inviteCode) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Waiting for Players
          </h1>
          <p className="text-sm text-gray-400">Share this code with friends</p>
        </div>

        <button
          onClick={copyCode}
          className="
            w-full py-5 rounded-xl
            bg-gray-800/60 border-2 border-dashed border-emerald-400/40
            hover:border-emerald-400/60 transition-all group cursor-pointer
          "
        >
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Room Code</div>
          <div className="text-3xl font-mono font-bold tracking-[0.3em] text-emerald-400 group-hover:text-emerald-300 transition-colors">
            {inviteCode}
          </div>
          <div className="text-xs text-gray-500 mt-1">{copied ? "Copied!" : "Click to copy"}</div>
        </button>

        <p className="text-xs text-gray-500">Waiting for {maxPlayers} players...</p>

        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Snakes & Ladders
        </h1>
        <p className="text-sm text-gray-400">Create or join an online game</p>
      </div>

      <div className="w-full space-y-3">
        <label className="text-xs text-gray-500 uppercase tracking-wider">Players</label>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setPlayerCount(n)}
              className={`
                flex-1 py-3 rounded-xl text-sm font-medium transition-all
                ${
                  playerCount === n
                    ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-400"
                    : "bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:text-white"
                }
              `}
            >
              {n} Players
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={isCreating}
        className="
          w-full py-4 rounded-xl font-medium
          bg-gradient-to-r from-emerald-500 to-cyan-500
          hover:from-emerald-400 hover:to-cyan-400
          text-white transition-all duration-200
          active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100
        "
      >
        {isCreating ? <span className="flex items-center justify-center gap-2"><Spinner /> Creating...</span> : "Create Room"}
      </button>

      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-xs text-gray-500 uppercase">or join by code</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      <div className="w-full flex gap-2">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => {
            setJoinCode(e.target.value.toUpperCase());
            setError("");
          }}
          placeholder="Enter 6-digit code"
          maxLength={6}
          className="
            flex-1 px-4 py-3 rounded-xl text-sm
            bg-gray-800/60 border border-gray-700/50
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-emerald-400
            transition-all uppercase tracking-[0.2em] font-mono text-center
          "
        />
        <button
          onClick={handleJoin}
          disabled={!joinCode.trim() || isJoining}
          className="
            px-6 py-3 rounded-xl text-sm font-medium
            bg-gray-700 hover:bg-gray-600
            text-white disabled:opacity-40
            transition-all
          "
        >
          {isJoining ? <span className="flex items-center gap-1.5"><Spinner className="h-3 w-3" /> Joining</span> : "Join"}
        </button>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Back to Menu
      </button>
    </div>
  );
}
