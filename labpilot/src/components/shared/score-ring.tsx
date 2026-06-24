"use client";

import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 48,
  strokeWidth = 4,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="fill-none stroke-neutral-100" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("fill-none transition-all duration-700", color.replace("text-", "stroke-"))}
        />
      </svg>
      <span className={cn("absolute text-xs font-bold", color)}>{score}</span>
    </div>
  );
}
