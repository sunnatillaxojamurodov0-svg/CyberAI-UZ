import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: "primary" | "ghost";
  strength?: number;
}

export function MagneticButton({
  children,
  variant = "primary",
  strength = 18,
  className,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const tx = useTransform(sx, (v) => `${v}px`);
  const ty = useTransform(sy, (v) => `${v}px`);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set(((e.clientX - cx) / r.width) * strength);
    y.set(((e.clientY - cy) / r.height) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    "relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold tracking-tight transition-colors active:scale-[0.98] will-change-transform";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-[0_0_50px_-12px_color-mix(in_oklab,var(--primary)_55%,transparent)] hover:shadow-[0_0_70px_-12px_color-mix(in_oklab,var(--primary)_75%,transparent)]"
      : "glass-panel border border-border text-foreground hover:border-border-strong hover:bg-white/5";

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: tx, y: ty }}
      className={cn(base, styles, className)}
      {...(props as object)}
    >
      {children}
    </motion.button>
  );
}
