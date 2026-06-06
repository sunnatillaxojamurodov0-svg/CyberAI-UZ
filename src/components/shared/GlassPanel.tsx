import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassPanel({
  children,
  className,
  hoverGlow = false,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hoverGlow?: boolean;
  variant?: "default" | "strong" | "cyan";
}) {
  return (
    <div
      className={cn(
        variant === "default" && "glass-panel",
        variant === "strong" && "glass-panel-strong",
        variant === "cyan" && "glass-panel-cyan",
        "border border-border rounded-2xl relative overflow-hidden",
        hoverGlow && "glow-hover",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
