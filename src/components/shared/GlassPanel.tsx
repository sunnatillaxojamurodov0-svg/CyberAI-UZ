import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassPanel({
  children,
  className,
  hoverGlow = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; hoverGlow?: boolean }) {
  return (
    <div
      className={cn(
        "glass-panel border border-border rounded-2xl relative overflow-hidden",
        hoverGlow && "glow-hover",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
