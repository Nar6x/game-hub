"use client";

interface GameControlsProps {
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onResetScores: () => void;
}

export function GameControls({
  onPlayAgain,
  onBackToMenu,
  onResetScores,
}: GameControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <button
        onClick={onPlayAgain}
        className="
          w-full sm:w-auto px-6 py-2.5 rounded-xl
          bg-indigo-500 hover:bg-indigo-400
          text-white font-medium text-sm
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-indigo-400
          active:scale-95
        "
      >
        Play Again
      </button>
      <button
        onClick={onBackToMenu}
        className="
          w-full sm:w-auto px-6 py-2.5 rounded-xl
          bg-gray-700 hover:bg-gray-600
          text-gray-200 font-medium text-sm
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-gray-500
          active:scale-95
        "
      >
        Back to Menu
      </button>
      <button
        onClick={onResetScores}
        className="
          w-full sm:w-auto px-6 py-2.5 rounded-xl
          bg-transparent hover:bg-gray-800
          text-gray-500 hover:text-gray-300 font-medium text-sm
          border border-gray-700 hover:border-gray-600
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-gray-500
          active:scale-95
        "
      >
        Reset Scores
      </button>
    </div>
  );
}
