"use client";

import { useState, useEffect, useRef } from "react";

interface DiceProps {
  value: number | null;
  rolling: boolean;
}

export function Dice({ value, rolling }: DiceProps) {
  const [display, setDisplay] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasRollingRef = useRef(false);

  useEffect(() => {
    const currentInterval = intervalRef.current;
    return () => {
      if (currentInterval) clearInterval(currentInterval);
    };
  }, []);

  useEffect(() => {
    if (rolling && !wasRollingRef.current) {
      wasRollingRef.current = true;

      if (intervalRef.current) clearInterval(intervalRef.current);

      const target = value ?? 1;
      let count = 0;
      const maxCount = 10;

      intervalRef.current = setInterval(() => {
        count++;
        if (count < maxCount) {
          setDisplay(Math.floor(Math.random() * 6) + 1);
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          wasRollingRef.current = false;
          setDisplay(target);
        }
      }, 100);
    }

    if (!rolling) {
      wasRollingRef.current = false;
    }
  }, [rolling, value]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center select-none transition-all duration-300 bg-gradient-to-br from-gray-700 to-gray-800 border-gray-500 shadow-lg"
      >
        <span className="text-5xl font-black tabular-nums text-emerald-400">
          {display}
        </span>
      </div>
    </div>
  );
}
