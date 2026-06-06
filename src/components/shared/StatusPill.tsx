import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusPill({
  children,
  tone = "primary",
  className,
}: {
  children: ReactNode;
  tone?: "primary" | "accent" | "emerald";
  className?: string;
}) {
  const color =
    tone === "primary"
      ? "text-primary border-primary/25 bg-primary/5"
      : tone === "accent"
        ? "text-accent border-accent/25 bg-accent/5"
        : "text-emerald border-emerald/25 bg-emerald/5";
  const dot = tone === "primary" ? "bg-primary" : tone === "accent" ? "bg-accent" : "bg-emerald";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-[10px] font-bold tracking-[0.18em] uppercase",
        color,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
            dot,
          )}
        />
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dot)} />
      </span>
      {children}
    </div>
  );
}
