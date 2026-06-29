import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SolutionRevealProps {
  solution: string[];
  isSolved: boolean;
}

export function SolutionReveal({ solution, isSolved }: SolutionRevealProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isSolved || !solution || solution.length === 0) return null;

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
            Solution Walkthrough
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn("text-emerald-400 transition-transform", isExpanded && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {solution.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-emerald-500/10 font-mono text-[10px] font-bold text-emerald-400">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/80">{step}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
