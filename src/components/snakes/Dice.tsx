"use client";

import { useState, useEffect, useRef } from "react";

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function DiceFace({ value }: { value: number }) {
  const dots = DOT_POSITIONS[value] || DOT_POSITIONS[1];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-2.5">
      {dots.map(([cx, cy], i) => (
        <circle key={`${value}-${i}`} cx={cx} cy={cy} r={9} fill="#34d399" className="drop-shadow-sm" />
      ))}
    </svg>
  );
}

const FACE_ROTATIONS: Record<number, string> = {
  1: "rotateX(-20deg) rotateY(0deg)",
  2: "rotateX(-20deg) rotateY(-90deg)",
  3: "rotateX(-90deg) rotateY(0deg)",
  4: "rotateX(50deg) rotateY(0deg)",
  5: "rotateX(-20deg) rotateY(90deg)",
  6: "rotateX(-200deg) rotateY(0deg)",
};

export function Dice({ value, rolling }: { value: number | null; rolling: boolean }) {
  const [displayValue, setDisplayValue] = useState(1);
  const [phase, setPhase] = useState<"idle" | "shaking" | "revealing" | "landed">("idle");
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
      setPhase("shaking");

      const shakeCount = 10;
      let count = 0;
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count >= shakeCount) {
          clearInterval(interval);
          const finalValue = value !== null ? value : Math.floor(Math.random() * 6) + 1;
          setDisplayValue(finalValue);
          setPhase("revealing");

          timers.current.push(
            setTimeout(() => {
              setPhase("landed");
              timers.current.push(
                setTimeout(() => {
                  setPhase("idle");
                  wasRolling.current = false;
                }, 350)
              );
            }, 350)
          );
        }
      }, 70);

      return () => clearInterval(interval);
    }

    if (!rolling && wasRolling.current) {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];

      const finalValue = value !== null ? value : displayValue;
      setDisplayValue(finalValue);
      setPhase("landed");

      timers.current.push(
        setTimeout(() => {
          setPhase("idle");
          wasRolling.current = false;
        }, 350)
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolling, value]);

  const faceRotation = FACE_ROTATIONS[displayValue] || FACE_ROTATIONS[1];

  const glowClass =
    phase === "shaking"
      ? "shadow-[0_0_30px_rgba(52,211,153,0.5)] border-emerald-400/60"
      : phase === "landed" || phase === "revealing"
        ? "shadow-[0_0_20px_rgba(52,211,153,0.3)] border-emerald-400/40"
        : "border-gray-600 shadow-lg";

  const transitionClass = phase !== "shaking" ? "transition-transform duration-300" : "";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-24 h-24" style={{ perspective: "600px" }}>
        <div
          className={`w-full h-full relative border-2 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 ${glowClass} ${transitionClass}`}
          style={{
            transformStyle: "preserve-3d",
            transform: faceRotation,
            ...(phase === "shaking" ? { animation: "dice-shake 0.15s ease-in-out infinite" } : {}),
            transitionTimingFunction: phase === "landed" ? "cubic-bezier(0.34,1.56,0.64,1)" : undefined,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-gradient-to-br from-gray-700 to-gray-800" style={{ transform: "translateZ(48px)" }}>
            <DiceFace value={1} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-gradient-to-br from-gray-700 to-gray-800" style={{ transform: "rotateY(180deg) translateZ(48px)" }}>
            <DiceFace value={6} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-gradient-to-br from-gray-700 to-gray-800" style={{ transform: "rotateY(90deg) translateZ(48px)" }}>
            <DiceFace value={5} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-gradient-to-br from-gray-700 to-gray-800" style={{ transform: "rotateY(-90deg) translateZ(48px)" }}>
            <DiceFace value={2} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-gradient-to-br from-gray-700 to-gray-800" style={{ transform: "rotateX(90deg) translateZ(48px)" }}>
            <DiceFace value={3} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-gradient-to-br from-gray-700 to-gray-800" style={{ transform: "rotateX(-90deg) translateZ(48px)" }}>
            <DiceFace value={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
