"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUser } from "./UserContext";
import { supabase } from "@/lib/supabase/client";

export function Navbar() {
  const { username, isSet, setUsername } = useUser();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(username);
  const inputRef = useRef<HTMLInputElement>(null);

  const openEditor = () => {
    setDraft(username);
    setEditing(true);
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed.length >= 1 && trimmed !== username) {
      supabase
        .from("leaderboard")
        .update({ player_name: trimmed })
        .eq("player_name", username);
    }
    if (trimmed.length >= 1) {
      setUsername(trimmed);
    }
    setEditing(false);
  };

  return (
    <nav className="w-full border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent"
        >
          GameHub
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <Link
            href="/tictactoe"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Tic Tac Toe
          </Link>
          <Link
            href="/snakes-and-ladders"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Snakes & Ladders
          </Link>
          <Link
            href="/leaderboard"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Leaderboard
          </Link>

          {isSet && (
            <>
              <div className="w-px h-5 bg-gray-700" />
              <div className="relative">
                <button
                  onClick={() => (editing ? setEditing(false) : openEditor())}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-rose-400 flex items-center justify-center text-xs font-bold text-gray-950">
                    {username[0]?.toUpperCase()}
                  </div>
                  <span className="text-gray-300 hidden sm:inline">{username}</span>
                </button>

                {editing && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={save} />
                    <div className="absolute right-0 top-full mt-3 z-50 bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-2xl w-60 overflow-hidden">
                      <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
                        Username
                      </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") save();
                          if (e.key === "Escape") setEditing(false);
                        }}
                        maxLength={20}
                        className="min-w-0 flex-1 px-3 py-1.5 rounded-lg text-sm bg-gray-900 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                      <button
                        onClick={save}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-white transition-colors"
                      >
                        Save
                      </button>
                    </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
