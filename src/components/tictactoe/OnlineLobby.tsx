"use client";

import { useState } from "react";
import { Spinner } from "@/components/shared/Spinner";
import { updateLeaderboard } from "@/lib/leaderboard";

interface OnlineLobbyProps {
  username: string;
  inviteCode: string | null;
  onCreateRoom: () => void;
  onJoinByCode: (code: string) => Promise<{ error: string | null }>;
  onBack: () => void;
}

export function OnlineLobby({ username, inviteCode, onCreateRoom, onJoinByCode, onBack }: OnlineLobbyProps) {
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

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
    onCreateRoom();
  };

  const copyCode = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestLeaderboard = async () => {
    setTestResult(null);
    try {
      await updateLeaderboard(username || "test_user", "tictactoe", "win");
      setTestResult("OK - leaderboard updated");
    } catch (e) {
      setTestResult(`ERROR - ${e}`);
    }
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
          onClick={handleCreate}
          disabled={isCreating}
          className="
            w-full py-3 rounded-xl font-medium text-sm
            bg-gray-800/40 border border-gray-700/50
            text-gray-400 hover:text-white hover:border-gray-600
            transition-all disabled:opacity-50
          "
        >
          {isCreating ? <span className="flex items-center justify-center gap-2"><Spinner /> Finding...</span> : "Find Random Match"}
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
        onClick={handleCreate}
        disabled={isCreating}
        className="
          w-full py-4 rounded-xl font-medium
          bg-gradient-to-r from-cyan-500 to-rose-500
          hover:from-cyan-400 hover:to-rose-400
          text-white transition-all duration-200
          active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100
        "
      >
        {isCreating ? <span className="flex items-center justify-center gap-2"><Spinner /> Creating...</span> : "Create Private Room"}
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
          {isJoining ? <span className="flex items-center gap-1.5"><Spinner className="h-3 w-3" /> Joining</span> : "Join"}
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
        onClick={handleCreate}
        disabled={isCreating}
        className="
          w-full py-3 rounded-xl font-medium text-sm
          bg-gray-800/40 border border-gray-700/50
          text-gray-400 hover:text-white hover:border-gray-600
          transition-all disabled:opacity-50
        "
      >
        {isCreating ? <span className="flex items-center justify-center gap-2"><Spinner /> Finding...</span> : "Find Random Match"}
      </button>

      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Back to Menu
      </button>

      <div className="w-full mt-4 p-3 rounded-xl bg-gray-800/30 border border-gray-700/30">
        <button
          onClick={handleTestLeaderboard}
          className="w-full py-2 rounded-lg text-xs font-medium bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-all"
        >
          Test Leaderboard Write
        </button>
        {testResult && (
          <p className={`mt-2 text-xs text-center ${testResult.startsWith("OK") ? "text-emerald-400" : "text-rose-400"}`}>
            {testResult}
          </p>
        )}
      </div>
    </div>
  );
}
