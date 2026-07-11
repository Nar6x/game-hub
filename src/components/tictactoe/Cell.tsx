"use client";

import { Cell as CellType } from "@/lib/types";

interface CellProps {
  value: CellType;
  index: number;
  onClick: (index: number) => void;
  isWinningCell: boolean;
  disabled: boolean;
}

export function Cell({
  value,
  index,
  onClick,
  isWinningCell,
  disabled,
}: CellProps) {
  return (
    <button
      onClick={() => onClick(index)}
      disabled={disabled || value !== null}
      className={`
        relative aspect-square flex items-center justify-center
        text-4xl sm:text-5xl md:text-6xl font-bold
        rounded-xl transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900
        ${
          value === null && !disabled
            ? "hover:bg-gray-700/80 cursor-pointer active:scale-95"
            : "cursor-default"
        }
        ${
          isWinningCell
            ? "bg-indigo-500/20 ring-2 ring-indigo-400 animate-pulse"
            : "bg-gray-800/60"
        }
      `}
      aria-label={`Cell ${index + 1}${value ? `, marked ${value}` : ""}`}
    >
      {value && (
        <span
          className={`
            animate-[pop_0.2s_ease-out]
            ${value === "X" ? "text-cyan-400" : "text-rose-400"}
          `}
        >
          {value}
        </span>
      )}
    </button>
  );
}
