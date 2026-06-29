import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { ProgressiveBlur } from "@/components/shared/ProgressiveBlur";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { StatusPill } from "@/components/shared/StatusPill";
import { LeaderboardPage } from "@/components/features/leaderboard/LeaderboardPage";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "CyberAI — Leaderboard" },
      {
        name: "description",
        content:
          "Global leaderboard for CyberAI CTF challenges. Compete with elite researchers worldwide.",
      },
      { property: "og:title", content: "CyberAI — Leaderboard" },
      {
        property: "og:description",
        content: "Global CTF leaderboard. Compete and climb the ranks.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/leaderboard" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/leaderboard" }],
  }),
  component: LeaderboardRoute,
});

function LeaderboardRoute() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <ProgressiveBlur position="top" />
      <ProgressiveBlur position="bottom" />
      <Navbar />
      <main className="relative z-10">
        <section className="relative overflow-hidden px-6 pt-32 pb-10">
          <AnimatedGrid />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="flex justify-center">
              <StatusPill tone="accent">Global Leaderboard</StatusPill>
            </div>
            <h1 className="mt-7 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance">
              Compete with the <span className="gradient-text">elite.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Climb the ranks by solving CTF challenges. Score points based on methodology,
              efficiency, and independence.
            </p>
          </div>
        </section>
        <LeaderboardPage />
      </main>
      <Footer />
    </div>
  );
}
