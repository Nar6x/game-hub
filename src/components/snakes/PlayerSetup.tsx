"use client";

interface PlayerSetupProps {
  playerInputs: string[];
  onAddPlayer: () => void;
  onRemovePlayer: () => void;
  onUpdateName: (index: number, name: string) => void;
  onStart: () => void;
}

export function PlayerSetup({
  playerInputs,
  onAddPlayer,
  onRemovePlayer,
  onUpdateName,
  onStart,
}: PlayerSetupProps) {
  const validCount = playerInputs.filter((n) => n.trim().length >= 1).length;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-3">
        {playerInputs.map((name, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor: ["#22d3ee", "#f43f5e", "#a78bfa", "#34d399"][i % 4],
              }}
            />
            <input
              type="text"
              value={name}
              onChange={(e) => onUpdateName(i, e.target.value)}
              placeholder={`Player ${i + 1}`}
              maxLength={15}
              className="
                flex-1 px-4 py-2.5 rounded-xl text-sm
                bg-gray-800/60 border border-gray-700/50
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-emerald-400
                transition-all
              "
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {playerInputs.length < 4 && (
          <button
            onClick={onAddPlayer}
            className="
              flex-1 py-2.5 rounded-xl text-sm
              bg-gray-800/40 border border-gray-700/50
              text-gray-400 hover:text-white hover:border-gray-600
              transition-all
            "
          >
            + Add Player
          </button>
        )}
        {playerInputs.length > 2 && (
          <button
            onClick={onRemovePlayer}
            className="
              flex-1 py-2.5 rounded-xl text-sm
              bg-gray-800/40 border border-gray-700/50
              text-gray-400 hover:text-rose-400 hover:border-rose-400/30
              transition-all
            "
          >
            Remove Player
          </button>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={validCount < 2}
        className="
          w-full py-3 rounded-xl font-medium
          bg-gradient-to-r from-emerald-500 to-cyan-500
          hover:from-emerald-400 hover:to-cyan-400
          text-white text-sm
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200
          active:scale-[0.98]
        "
      >
        Start Game ({validCount} players)
      </button>
    </div>
  );
}
