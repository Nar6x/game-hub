"use client";

import { ReactNode } from "react";

export function GameCard({
  title,
  description,
  icon,
  color,
  href,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  color: "cyan" | "rose" | "amber" | "emerald";
  href: string;
  children?: ReactNode;
}) {
  const colorMap = {
    cyan: "border-cyan-400/20 hover:border-cyan-400/50 hover:shadow-cyan-400/10",
    rose: "border-rose-400/20 hover:border-rose-400/50 hover:shadow-rose-400/10",
    amber: "border-amber-400/20 hover:border-amber-400/50 hover:shadow-amber-400/10",
    emerald: "border-emerald-400/20 hover:border-emerald-400/50 hover:shadow-emerald-400/10",
  };

  const textColor = {
    cyan: "text-cyan-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
  };

  return (
    <a
      href={href}
      className={`
        block p-6 rounded-2xl bg-gray-800/40 border
        ${colorMap[color]}
        hover:bg-gray-800/60 hover:shadow-xl
        transition-all duration-300 group
      `}
    >
      <div className="flex items-start gap-4">
        <div
          className={`text-4xl ${textColor[color]} group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${textColor[color]}`}>{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
          {children}
        </div>
      </div>
    </a>
  );
}
