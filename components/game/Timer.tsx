"use client";

import { useEffect, useRef } from "react";

interface TimerProps {
  seconds: number;
  maxSeconds: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  onTick?: () => void;
  running?: boolean;
}

export function Timer({
  seconds,
  maxSeconds,
  label,
  size = "md",
  onTick,
  running = true,
}: TimerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && onTick) {
      intervalRef.current = setInterval(onTick, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onTick]);

  const fraction = seconds / maxSeconds;
  const color =
    fraction > 0.5
      ? "#22c55e"
      : fraction > 0.25
        ? "#f59e0b"
        : "#ef4444";

  const dimensions = {
    sm: { size: 48, stroke: 3, fontSize: "text-sm" },
    md: { size: 72, stroke: 4, fontSize: "text-xl" },
    lg: { size: 96, stroke: 5, fontSize: "text-3xl" },
  }[size];

  const radius = (dimensions.size - dimensions.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dimensions.size, height: dimensions.size }}>
        <svg width={dimensions.size} height={dimensions.size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={dimensions.stroke}
          />
          {/* Progress circle */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
          />
        </svg>
        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${dimensions.fontSize} font-bold tabular-nums`} style={{ color }}>
            {Math.ceil(seconds)}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs text-[#94a3b8] uppercase tracking-wider">{label}</span>
      )}
    </div>
  );
}
