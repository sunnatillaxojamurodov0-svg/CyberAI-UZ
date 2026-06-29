import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface RatingData {
  total_ratings: number;
  avg_rating: number;
  avg_difficulty: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

interface ChallengeRatingProps {
  challengeId: string;
}

export function ChallengeRating({ challengeId }: ChallengeRatingProps) {
  const { user } = useAuth();
  const [data, setData] = useState<RatingData | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [userDifficulty, setUserDifficulty] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await fetch(`/api/console/ratings?challengeId=${challengeId}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.ok) {
          setData(json.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [challengeId]);

  const handleRate = async (rating: number, difficulty: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/console/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challengeId,
          rating,
          difficultyRating: difficulty,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setUserRating(rating);
        setUserDifficulty(difficulty);
        // Refresh data
        const refreshRes = await fetch(`/api/console/ratings?challengeId=${challengeId}`, {
          credentials: "include",
        });
        const refreshJson = await refreshRes.json();
        if (refreshJson.ok) {
          setData(refreshJson.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="size-4 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
      </div>
    );
  }

  if (!data) return null;

  const getStarBars = () => {
    const total = data.total_ratings || 1;
    return [
      { stars: 5, count: data.five_star, percent: (data.five_star / total) * 100 },
      { stars: 4, count: data.four_star, percent: (data.four_star / total) * 100 },
      { stars: 3, count: data.three_star, percent: (data.three_star / total) * 100 },
      { stars: 2, count: data.two_star, percent: (data.two_star / total) * 100 },
      { stars: 1, count: data.one_star, percent: (data.one_star / total) * 100 },
    ];
  };

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={14} className="text-accent" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Community Ratings
        </span>
      </div>

      {/* Average display */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <div className="font-display text-3xl font-bold text-accent">
            {data.avg_rating > 0 ? data.avg_rating.toFixed(1) : "-"}
          </div>
          <div className="text-[10px] text-muted-foreground">Quality</div>
        </div>
        <div className="text-center">
          <div className="font-display text-3xl font-bold text-amber-400">
            {data.avg_difficulty > 0 ? data.avg_difficulty.toFixed(1) : "-"}
          </div>
          <div className="text-[10px] text-muted-foreground">Difficulty</div>
        </div>
        <div className="text-center">
          <div className="font-display text-2xl font-bold">{data.total_ratings}</div>
          <div className="text-[10px] text-muted-foreground">Ratings</div>
        </div>
      </div>

      {/* Star distribution */}
      <div className="space-y-1.5 mb-4">
        {getStarBars().map((bar) => (
          <div key={bar.stars} className="flex items-center gap-2">
            <span className="w-3 text-[10px] text-muted-foreground">{bar.stars}</span>
            <Star size={10} className="text-amber-400" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.percent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-amber-400"
              />
            </div>
            <span className="w-6 text-right text-[10px] text-muted-foreground">{bar.count}</span>
          </div>
        ))}
      </div>

      {/* User rating */}
      {user && (
        <div className="border-t border-border pt-3">
          <div className="text-[10px] text-muted-foreground mb-2">Your Rating</div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Quality</div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star, userDifficulty || data.avg_difficulty)}
                    disabled={saving}
                    className={cn(
                      "transition-colors",
                      star <= userRating
                        ? "text-amber-400"
                        : "text-muted-foreground/30 hover:text-amber-400/50",
                    )}
                  >
                    <Star size={16} fill={star <= userRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Difficulty</div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(userRating || data.avg_rating, star)}
                    disabled={saving}
                    className={cn(
                      "transition-colors",
                      star <= userDifficulty
                        ? "text-red-400"
                        : "text-muted-foreground/30 hover:text-red-400/50",
                    )}
                  >
                    <Star size={16} fill={star <= userDifficulty ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
