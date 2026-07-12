"use client";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col animate-[fade-in_0.2s_ease-out]">
      {children}
    </div>
  );
}
