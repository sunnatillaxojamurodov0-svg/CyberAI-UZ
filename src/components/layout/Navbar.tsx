import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Platform", to: "/" },
  { label: "Projects", to: "/" },
  { label: "Prompts", to: "/" },
  { label: "About", to: "/about" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(2, 4, 8, 0.4)", "rgba(2, 4, 8, 0.82)"]);
  const blur = useTransform(scrollY, [0, 80], ["blur(6px)", "blur(16px)"]);
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      style={{ backgroundColor: bg, backdropFilter: blur, WebkitBackdropFilter: blur as unknown as string }}
      className="fixed inset-x-0 top-0 z-50 border-b border-border"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="relative grid size-7 place-items-center rounded-md">
            <span className="absolute inset-0 rotate-45 rounded-[5px] bg-primary transition-transform duration-500 group-hover:rotate-[225deg]" />
            <span className="absolute inset-[5px] rotate-45 rounded-[3px] bg-background" />
            <span className="absolute size-1.5 rounded-full bg-primary" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            CYBER<span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className="relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Sign in
          </Link>
          <MagneticButton className="!px-5 !py-2 !text-xs">Launch Console</MagneticButton>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden rounded-md p-2 text-foreground"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-border transition-[max-height,opacity] duration-500",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {NAV.map((n) => (
            <Link key={n.label} to={n.to} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground">
              {n.label}
            </Link>
          ))}
          <Link to="/" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground">
            Sign in
          </Link>
          <button className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            Launch Console
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
