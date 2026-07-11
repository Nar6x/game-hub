"use client";

import { Cell } from "./Cell";
import { Board as BoardType } from "@/lib/types";

interface BoardProps {
  board: BoardType;
  onCellClick: (index: number) => void;
  winningLine: number[] | null;
  disabled: boolean;
}

export function Board({
  board,
  onCellClick,
  winningLine,
  disabled,
}: BoardProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[340px] sm:max-w-[400px] mx-auto p-3 sm:p-4 bg-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-700/50">
      {board.map((cell, index) => (
        <Cell
          key={index}
          value={cell}
          index={index}
          onClick={onCellClick}
          isWinningCell={winningLine?.includes(index) ?? false}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
