import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolStatus = "loading" | "success" | "error";

interface ToolUseCardProps {
  name: string;
  status: ToolStatus;
  result?: string;
  error?: string;
  duration?: number;
}

export function ToolUseCard({ name, status, result, error, duration }: ToolUseCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "my-3 overflow-hidden rounded-xl border transition-colors",
        status === "loading" && "border-accent/20 bg-accent/[0.02]",
        status === "success" && "border-emerald-500/20 bg-emerald-500/[0.02]",
        status === "error" && "border-destructive/30 bg-destructive/[0.02]",
      )}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2.5">
          {status === "loading" && (
            <Loader2 size={15} className="text-accent animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle2 size={15} className="text-emerald-400" />
          )}
          {status === "error" && (
            <AlertCircle size={15} className="text-destructive" />
          )}
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {status === "loading" ? "Executing" : status === "success" ? "Completed" : "Failed"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {duration && (
            <span className="font-mono text-[10px] text-muted-foreground/60">{duration}ms</span>
          )}
          {(status === "success" || status === "error") && result && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 pt-1.5">
        {status === "loading" ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-xs text-muted-foreground/80 font-mono">{name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/80 font-mono">{name}</span>
        )}
      </div>

      {status === "loading" && (
        <div className="h-0.5 w-full bg-accent/10 overflow-hidden">
          <div className="h-full w-full animate-pulse bg-accent/40" />
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "border-t px-4 py-3",
                status === "success" && "border-emerald-500/10",
                status === "error" && "border-destructive/20",
              )}
            >
              <pre className="font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {status === "error" && error ? error : result}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
