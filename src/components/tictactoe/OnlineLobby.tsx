"use client";

import { useState } from "react";

interface OnlineLobbyProps {
  username: string;
  inviteCode: string | null;
  onCreateRoom: () => void;
  onJoinByCode: (code: string) => Promise<{ error: string | null }>;
  onBack: () => void;
}

export function OnlineLobby({ inviteCode, onCreateRoom, onJoinByCode, onBack }: OnlineLobbyProps) {
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
            Waiting for Opponent
          </h1>
          <p className="text-sm text-gray-400">Share this code with a friend</p>
        </div>

        <button
          onClick={copyCode}
          className="
            w-full py-5 rounded-xl
            bg-gray-800/60 border-2 border-dashed border-cyan-400/40
            hover:border-cyan-400/60 transition-all group cursor-pointer
          "
        >
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Room Code</div>
          <div className="text-3xl font-mono font-bold tracking-[0.3em] text-cyan-400 group-hover:text-cyan-300 transition-colors">
            {inviteCode}
          </div>
          <div className="text-xs text-gray-500 mt-1">{copied ? "Copied!" : "Click to copy"}</div>
        </button>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <button
          onClick={onCreateRoom}
          className="
            w-full py-3 rounded-xl font-medium text-sm
            bg-gray-800/40 border border-gray-700/50
            text-gray-400 hover:text-white hover:border-gray-600
            transition-all
          "
        >
          Find Random Match
        </button>

        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
          Online Tic Tac Toe
        </h1>
        <p className="text-sm text-gray-400">
          Create a room or join by code
        </p>
      </div>

      <button
        onClick={onCreateRoom}
        className="
          w-full py-4 rounded-xl font-medium
          bg-gradient-to-r from-cyan-500 to-rose-500
          hover:from-cyan-400 hover:to-rose-400
          text-white transition-all duration-200
          active:scale-[0.98]
        "
      >
        Create Private Room
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
            focus:outline-none focus:ring-2 focus:ring-cyan-400
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
          {isJoining ? "..." : "Join"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-400">{error}</p>
      )}

      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-xs text-gray-500 uppercase">or</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      <button
        onClick={onCreateRoom}
        className="
          w-full py-3 rounded-xl font-medium text-sm
          bg-gray-800/40 border border-gray-700/50
          text-gray-400 hover:text-white hover:border-gray-600
          transition-all
        "
      >
        Find Random Match
      </button>

      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Back to Menu
      </button>
    </div>
  );
}
