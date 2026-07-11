"use client";

import { useState, useEffect, useRef } from "react";

interface DiceProps {
  value: number | null;
  rolling: boolean;
}

export function Dice({ value, rolling }: DiceProps) {
  const [display, setDisplay] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rollingRef = useRef(rolling);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (rolling) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      rollingRef.current = true;

      let count = 0;
      const maxCount = 10;

      intervalRef.current = setInterval(() => {
        count++;
        if (count < maxCount) {
          setDisplay(Math.floor(Math.random() * 6) + 1);
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setDisplay(value ?? 1);
          rollingRef.current = false;
          setIsComplete(true);
        }
      }, 100);
    }
  }, [rolling, value]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center select-none transition-all duration-200 bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg ${
          isComplete ? "border-emerald-400 shadow-emerald-400/20" : "border-gray-500"
        }`}
      >
        <span className="text-5xl font-black tabular-nums text-emerald-400">
          {display}
        </span>
      </div>
    </div>
  );
}
