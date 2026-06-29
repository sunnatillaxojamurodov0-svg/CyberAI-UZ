import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Lock,
  ChevronRight,
  Trophy,
  Terminal as TermIcon,
  Skull,
  ShieldAlert,
  Star,
  Search,
  X,
  Globe,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  getChallengesByLevel,
  getChallenges,
  LEVEL_META,
  isEliteUnlocked,
} from "@/lib/console/challenges";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { CTFChallenge, CTFLevel } from "@/lib/console/types";

interface ChallengeGridProps {
  onSelect: (challenge: CTFChallenge) => void;
  isSolved: (id: string) => boolean;
  bestScore: (id: string) => number | undefined;
  totalPoints: number;
  solvedCount: number;
  base60Solved: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  web: "text-cyan-400",
  network: "text-blue-400",
  crypto: "text-purple-400",
  forensics: "text-amber-400",
  privesc: "text-red-400",
  recon: "text-emerald-400",
  password: "text-pink-400",
  reversing: "text-orange-400",
  stego: "text-teal-400",
  osint: "text-lime-400",
};

const LEVELS: CTFLevel[] = [1, 2, 3, 4];
const BOOKMARKS_KEY = "cyberai_console_bookmarks";

function loadBookmarks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveBookmarks(bookmarks: Set<string>) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]));
  } catch {
    // ignore
  }
}

export function ChallengeGrid({
  onSelect,
  isSolved,
  bestScore,
  totalPoints,
  solvedCount,
  base60Solved,
}: ChallengeGridProps) {
  const [activeLevel, setActiveLevel] = useState<CTFLevel | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadBookmarks());
  const { t } = useTranslation();
  const eliteUnlocked = isEliteUnlocked(base60Solved);

  // Save bookmarks to localStorage
  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  const toggleBookmark = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Get all challenges or challenges by level
  const allChallenges = useMemo(() => {
    if (activeLevel === "all") return getChallenges();
    return getChallengesByLevel(activeLevel);
  }, [activeLevel]);

  // Get unique categories from visible challenges
  const categories = useMemo(() => {
    const cats = new Set(allChallenges.map((c) => c.category));
    return Array.from(cats).sort();
  }, [allChallenges]);

  // Filter challenges based on search, category, and bookmarks
  const filteredChallenges = useMemo(() => {
    return allChallenges.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !activeCategory || c.category === activeCategory;
      const matchesBookmark = !showBookmarksOnly || bookmarks.has(c.id);
      return matchesSearch && matchesCategory && matchesBookmark;
    });
  }, [allChallenges, searchQuery, activeCategory, showBookmarksOnly, bookmarks]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label={t("console.challenges_solved")}
          value={`${solvedCount}/70`}
          icon={CheckCircle2}
        />
        <StatCard
          label={t("console.total_points")}
          value={totalPoints.toLocaleString()}
          icon={Trophy}
        />
        <StatCard
          label={t("console.progress_title")}
          value={`${Math.round((base60Solved / 60) * 100)}%`}
          icon={TermIcon}
        />
        <StatCard
          label="Master"
          value={eliteUnlocked ? "UNLOCKED" : `${base60Solved}/60`}
          icon={eliteUnlocked ? Star : Lock}
          highlight={eliteUnlocked}
        />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t("common.search")} challenges...`}
            className="w-full rounded-lg border border-border bg-surface/40 py-2.5 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Bookmarks filter */}
        <button
          type="button"
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all",
            showBookmarksOnly
              ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
              : "border-border bg-surface/40 text-muted-foreground hover:border-accent/20",
          )}
        >
          <Bookmark size={14} />
          <span className="hidden sm:inline">Bookmarks</span>
          {bookmarks.size > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
              {bookmarks.size}
            </span>
          )}
        </button>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
              !activeCategory
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-surface/40 text-muted-foreground hover:border-accent/20",
            )}
          >
            {t("common.all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                activeCategory === cat
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border bg-surface/40 text-muted-foreground hover:border-accent/20",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Level tabs */}
      <div className="flex flex-wrap gap-2">
        {/* All levels button */}
        <button
          type="button"
          onClick={() => {
            setActiveLevel("all");
            setActiveCategory(null);
            setSearchQuery("");
          }}
          className={cn(
            "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
            activeLevel === "all"
              ? "border-accent/40 bg-accent/10"
              : "border-border bg-surface/40 hover:border-accent/20",
          )}
        >
          <span
            className={cn(
              "grid size-9 place-items-center rounded-lg font-display text-lg font-bold",
              activeLevel === "all"
                ? "bg-accent/20 text-accent"
                : "bg-surface-2 text-muted-foreground",
            )}
          >
            <Globe size={16} />
          </span>
          <div className="text-left">
            <div
              className={cn(
                "text-sm font-semibold",
                activeLevel === "all" ? "text-foreground" : "text-foreground/70",
              )}
            >
              All Levels
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {getChallenges().length} challenges
            </div>
          </div>
        </button>

        {LEVELS.map((lvl) => {
          const meta = LEVEL_META[lvl];
          const active = activeLevel === lvl;
          const isElite = lvl === 4;
          const locked = isElite && !eliteUnlocked;
          const total = isElite ? 10 : 20;
          const solved = getChallengesByLevel(lvl).filter((c) => isSolved(c.id)).length;

          return (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                if (!locked) {
                  setActiveLevel(lvl);
                  setActiveCategory(null);
                  setSearchQuery("");
                }
              }}
              disabled={locked}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                locked
                  ? "cursor-not-allowed border-border/50 bg-surface/20 opacity-60"
                  : active
                    ? isElite
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-accent/40 bg-accent/10"
                    : "border-border bg-surface/40 hover:border-accent/20",
              )}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-lg font-display text-lg font-bold",
                  locked
                    ? "bg-surface-2 text-muted-foreground/40"
                    : active
                      ? isElite
                        ? "bg-red-500/20 text-red-400"
                        : "bg-accent/20 text-accent"
                      : "bg-surface-2 text-muted-foreground",
                )}
              >
                {locked ? <Lock size={16} /> : isElite ? <Skull size={16} /> : lvl}
              </span>
              <div className="text-left">
                <div
                  className={cn(
                    "text-sm font-semibold",
                    locked
                      ? "text-muted-foreground/40"
                      : active
                        ? isElite
                          ? "text-red-300"
                          : "text-foreground"
                        : "text-foreground/70",
                  )}
                >
                  {meta.sublabel}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {locked ? meta.unlockRequirement : `${solved}/${total} solved`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Level description */}
      <p className={cn("text-sm", activeLevel === 4 ? "text-red-400/80" : "text-muted-foreground")}>
        {activeLevel === "all"
          ? "Browse all 70 CTF challenges across every difficulty tier."
          : LEVEL_META[activeLevel].description}
      </p>

      {/* Master Tier locked banner */}
      <AnimatePresence>
        {activeLevel === 4 && !eliteUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex items-start gap-4 rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-6"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-red-500/15">
              <ShieldAlert size={22} className="text-red-400" />
            </span>
            <div>
              <div className="font-display text-lg font-bold text-red-300">
                Master Tier — Locked
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                This level only unlocks for operators who have successfully completed all{" "}
                <span className="font-semibold text-foreground">60 CTFs</span>. Currently{" "}
                <span className="font-mono font-bold text-accent">{base60Solved}/60</span> solved.
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(base60Solved / 60) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-accent to-red-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge cards */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2",
          activeLevel === 4 ? "lg:grid-cols-1 xl:grid-cols-2" : "lg:grid-cols-3",
        )}
      >
        {filteredChallenges.map((c, i) => {
          const solved = isSolved(c.id);
          const score = bestScore(c.id);
          const isElite = c.level === 4;

          return (
            <motion.button
              key={c.id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelect(c)}
              className="group text-left"
            >
              <GlassPanel
                hoverGlow
                className={cn(
                  "h-full border p-5 transition-colors",
                  solved
                    ? "border-emerald-500/30"
                    : isElite
                      ? "border-red-500/20 hover:border-red-500/40"
                      : "border-border",
                )}
              >
                {/* Master badge */}
                {isElite && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-red-400">
                      <Skull size={10} />
                      Master
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      6 machines · 24h
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold uppercase tracking-[0.18em]",
                      CATEGORY_COLORS[c.category] ?? "text-muted-foreground",
                    )}
                  >
                    {c.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(e, c.id)}
                      className={cn(
                        "rounded-md p-1 transition-colors",
                        bookmarks.has(c.id)
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-muted-foreground/40 hover:text-muted-foreground",
                      )}
                    >
                      {bookmarks.has(c.id) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    </button>
                    {solved ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={15} />
                        {score !== undefined && (
                          <span className="font-mono text-[10px] font-bold">{score}%</span>
                        )}
                      </span>
                    ) : (
                      <ChevronRight
                        size={16}
                        className={cn(
                          "transition-transform group-hover:translate-x-0.5",
                          isElite
                            ? "text-red-400/40 group-hover:text-red-400"
                            : "text-muted-foreground/40 group-hover:text-accent",
                        )}
                      />
                    )}
                  </div>
                </div>

                <h3
                  className={cn(
                    "mt-3 font-display text-base font-bold tracking-tight",
                    isElite && "text-lg",
                  )}
                >
                  {c.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.summary}</p>

                {/* Master rabbit hole warning */}
                {isElite && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
                    <ShieldAlert size={12} className="shrink-0 text-amber-400" />
                    <span className="font-mono text-[10px] text-amber-400/80">
                      6 interconnected targets — rabbit holes exist
                    </span>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {c.targetIp}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold",
                      isElite ? "text-red-400" : "text-accent",
                    )}
                  >
                    {c.points} pts
                  </span>
                </div>
              </GlassPanel>
            </motion.button>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredChallenges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search size={32} className="mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No challenges match your search</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveCategory(null);
            }}
            className="mt-2 text-xs text-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        highlight ? "border-amber-500/30 bg-amber-500/[0.04]" : "border-border bg-surface/40",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          highlight ? "bg-amber-500/15" : "bg-accent/10",
        )}
      >
        <Icon size={16} className={highlight ? "text-amber-400" : "text-accent"} />
      </span>
      <div>
        <div
          className={cn(
            "font-display text-lg font-bold leading-none tabular-nums",
            highlight && "text-amber-300",
          )}
        >
          {value}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}
