"use client";

import { useState, useEffect, useRef } from "react";

export function Dice({ value, rolling }: { value: number | null; rolling: boolean }) {
  const [displayValue, setDisplayValue] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const wasRolling = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (rolling && !wasRolling.current) {
      wasRolling.current = true;
      setSpinning(true);

      const totalMs = 800;
      let elapsed = 0;
      const startInterval = 50;
      const endInterval = 200;

      const tick = () => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        elapsed += 50;
        const progress = Math.min(elapsed / totalMs, 1);
        const currentInterval = startInterval + (endInterval - startInterval) * progress;

        if (elapsed < totalMs) {
          timers.current.push(setTimeout(tick, currentInterval));
        } else {
          const finalValue = value !== null ? value : Math.floor(Math.random() * 6) + 1;
          setDisplayValue(finalValue);
          setSpinning(false);
          timers.current.push(
            setTimeout(() => {
              wasRolling.current = false;
            }, 200)
          );
        }
      };

      timers.current.push(setTimeout(tick, startInterval));
    }

    if (!rolling && wasRolling.current) {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];

      const finalValue = value !== null ? value : displayValue;
      setDisplayValue(finalValue);
      setSpinning(false);
      wasRolling.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolling, value]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative w-24 h-24 rounded-2xl border-2 flex items-center justify-center select-none transition-all duration-300 ${
          spinning
            ? "border-emerald-400/50 shadow-[0_0_24px_rgba(52,211,153,0.3)]"
            : "border-gray-500 shadow-lg"
        } bg-gradient-to-br from-gray-700 to-gray-800`}
        style={{
          transform: spinning ? "scale(1.05)" : "scale(1)",
        }}
      >
        <span
          className="text-5xl font-black tabular-nums text-emerald-400"
          style={{
            filter: spinning ? "blur(1px)" : "none",
            transition: spinning ? "none" : "filter 0.2s ease",
          }}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}
