"use client";

import { useState } from "react";
import { useUser } from "./UserContext";

export function UsernameModal() {
  const { setUsername, isSet } = useUser();
  const [input, setInput] = useState("");

  if (isSet) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length >= 2 && trimmed.length <= 20) {
      setUsername(trimmed);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700/50 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
            Welcome to GameHub
          </h2>
          <p className="text-sm text-gray-400">
            Pick a username to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your username"
            minLength={2}
            maxLength={20}
            autoFocus
            className="
              w-full px-4 py-3 rounded-xl
              bg-gray-800/60 border border-gray-700/50
              text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent
              transition-all
            "
          />
          <button
            type="submit"
            disabled={input.trim().length < 2}
            className="
              w-full py-3 rounded-xl font-medium
              bg-gradient-to-r from-cyan-500 to-rose-500
              hover:from-cyan-400 hover:to-rose-400
              text-white text-sm
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200
              active:scale-[0.98]
            "
          >
            Start Playing
          </button>
        </form>

        <p className="text-xs text-gray-600 text-center">
          2-20 characters. You can change this later.
        </p>
      </div>
    </div>
  );
}
