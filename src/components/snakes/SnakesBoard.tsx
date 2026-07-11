"use client";

import { useRef, useEffect, useState } from "react";
import { SnakesPlayer } from "@/lib/types";

const SNAKES: Record<number, number> = {
  16: 6, 47: 26, 49: 11, 56: 53, 62: 19,
  64: 60, 87: 24, 93: 73, 95: 75, 98: 78,
};

const LADDERS: Record<number, number> = {
  1: 38, 4: 14, 9: 31, 21: 42, 28: 84,
  36: 44, 51: 67, 71: 91, 80: 100,
};

const CELL = 52;
const BOARD = CELL * 10;

function getCellCenter(pos: number): { x: number; y: number } {
  if (pos <= 0) return { x: 0, y: 0 };
  const zero = pos - 1;
  const row = 9 - Math.floor(zero / 10);
  const rawCol = zero % 10;
  const col = row % 2 === 1 ? rawCol : 9 - rawCol;
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

function getCellColor(pos: number): string {
  const row = Math.floor((pos - 1) / 10);
  const col = (pos - 1) % 10;
  const isDark = (row + col) % 2 === 0;
  return isDark ? "#1a2332" : "#0f1923";
}

function SnakePath({ from, to }: { from: number; to: number }) {
  const start = getCellCenter(from);
  const end = getCellCenter(to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const midX1 = start.x + dx * 0.25 + Math.sin(from) * 15;
  const midY1 = start.y + dy * 0.3;
  const midX2 = start.x + dx * 0.5 - Math.cos(to) * 12;
  const midY2 = start.y + dy * 0.55;
  const midX3 = start.x + dx * 0.75 + Math.cos(from + to) * 10;
  const midY3 = start.y + dy * 0.8;

  const d = `M ${start.x} ${start.y} C ${midX1} ${midY1}, ${midX2} ${midY2}, ${start.x + dx * 0.5} ${start.y + dy * 0.5} S ${midX3} ${midY3}, ${end.x} ${end.y}`;

  return (
    <g>
      <path d={d} fill="none" stroke="#dc2626" strokeWidth={6} strokeLinecap="round" opacity={0.85} />
      <path d={d} fill="none" stroke="#f87171" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <circle cx={start.x} cy={start.y} r={9} fill="#dc2626" />
      <circle cx={start.x} cy={start.y} r={6} fill="#991b1b" />
      <circle cx={start.x - 3} cy={start.y - 2} r={1.5} fill="#fca5a5" />
      <circle cx={start.x + 3} cy={start.y - 2} r={1.5} fill="#fca5a5" />
      <polygon
        points={`${end.x},${end.y + 4} ${end.x - 5},${end.y - 4} ${end.x + 5},${end.y - 4}`}
        fill="#dc2626"
        opacity={0.9}
      />
    </g>
  );
}

function LadderPath({ from, to }: { from: number; to: number }) {
  const start = getCellCenter(from);
  const end = getCellCenter(to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;

  const railOff = 7;
  const rungCount = Math.max(3, Math.floor(len / 18));

  const lx1s = start.x + nx * railOff;
  const ly1s = start.y + ny * railOff;
  const lx2s = start.x - nx * railOff;
  const ly2s = start.y - ny * railOff;
  const lx1e = end.x + nx * railOff;
  const ly1e = end.y + ny * railOff;
  const lx2e = end.x - nx * railOff;
  const ly2e = end.y - ny * railOff;

  const rungs = Array.from({ length: rungCount }, (_, i) => {
    const t = (i + 1) / (rungCount + 1);
    return (
      <line
        key={i}
        x1={lx1s + (lx1e - lx1s) * t}
        y1={ly1s + (ly1e - ly1s) * t}
        x2={lx2s + (lx2e - lx2s) * t}
        y2={ly2s + (ly2e - ly2s) * t}
        stroke="#f59e0b"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.9}
      />
    );
  });

  return (
    <g>
      <line x1={lx1s} y1={ly1s} x2={lx1e} y2={ly1e} stroke="#d97706" strokeWidth={4} strokeLinecap="round" />
      <line x1={lx2s} y1={ly2s} x2={lx2e} y2={ly2e} stroke="#d97706" strokeWidth={4} strokeLinecap="round" />
      {rungs}
    </g>
  );
}

function PlayerToken({
  name,
  color,
  position,
  index,
}: {
  name: string;
  color: string;
  position: number;
  index: number;
}) {
  const [displayPos, setDisplayPos] = useState(position);
  const [hopping, setHopping] = useState(false);
  const prevPos = useRef(position);

  useEffect(() => {
    if (position !== prevPos.current) {
      setHopping(true);
      const timer = setTimeout(() => {
        setDisplayPos(position);
        setHopping(false);
      }, 50);
      prevPos.current = position;
      return () => clearTimeout(timer);
    }
  }, [position]);

  const c = getCellCenter(displayPos || 1);
  const offsets = [
    { x: -9, y: -9 },
    { x: 9, y: -9 },
    { x: -9, y: 9 },
    { x: 9, y: 9 },
  ];
  const off = position === 0 ? { x: 0, y: 0 } : offsets[index % 4];

  return (
    <g
      style={{
        transform: `translate(${c.x + off.x}px, ${c.y + off.y}px)`,
        transition: "transform 0.15s ease-out",
      }}
    >
      <circle
        r={11}
        fill={color}
        stroke="#0a0f18"
        strokeWidth={2.5}
        style={{
          transform: hopping ? "scale(1.15)" : "scale(1)",
          transition: "transform 0.15s ease-out",
        }}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="#0a0f18"
        fontSize={9}
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {name[0]?.toUpperCase()}
      </text>
    </g>
  );
}

export function SnakesBoard({ players }: { players: SnakesPlayer[] }) {
  return (
    <div className="w-full max-w-[560px] mx-auto">
      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-700/60 shadow-2xl shadow-black/50">
        <svg
          viewBox={`0 0 ${BOARD} ${BOARD}`}
          className="w-full block"
          style={{ backgroundColor: "#0a0f18" }}
        >
          {Array.from({ length: 100 }, (_, i) => {
            const pos = i + 1;
            const c = getCellCenter(pos);
            const bg = getCellColor(pos);
            return (
              <g key={pos}>
                <rect
                  x={c.x - CELL / 2}
                  y={c.y - CELL / 2}
                  width={CELL}
                  height={CELL}
                  fill={bg}
                  stroke="#1e293b"
                  strokeWidth={0.5}
                />
                <text
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#475569"
                  fontSize={11}
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  {pos}
                </text>
              </g>
            );
          })}

          {Object.entries(LADDERS).map(([from, to]) => (
            <LadderPath key={`l-${from}`} from={parseInt(from)} to={to} />
          ))}

          {Object.entries(SNAKES).map(([from, to]) => (
            <SnakePath key={`s-${from}`} from={parseInt(from)} to={to} />
          ))}

          {players.map((player, idx) => (
            <PlayerToken
              key={player.name}
              name={player.name}
              color={player.color}
              position={player.position}
              index={idx}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
