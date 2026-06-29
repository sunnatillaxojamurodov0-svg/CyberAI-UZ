import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { ProgressiveBlur } from "@/components/shared/ProgressiveBlur";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { StatusPill } from "@/components/shared/StatusPill";
import { ThreatsPage } from "@/components/features/threats/ThreatsPage";

export const Route = createFileRoute("/threats")({
  head: () => ({
    meta: [
      { title: "CyberAI — Automated Threat Emulation" },
      {
        name: "description",
        content: "AI-generated attack vectors that adapt to your architecture in real-time.",
      },
      { property: "og:title", content: "CyberAI — Threat Emulation" },
      { property: "og:description", content: "Automated threat generation and analysis." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://app.cyberaiuz.workers.dev/threats" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://app.cyberaiuz.workers.dev/threats" }],
  }),
  component: ThreatsRoute,
});

function ThreatsRoute() {
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
              <StatusPill tone="accent">Threat Emulation</StatusPill>
            </div>
            <h1 className="mt-7 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance">
              AI-powered <span className="gradient-text">threat analysis.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Generate realistic attack vectors tailored to your infrastructure. Understand your
              defenses before attackers do.
            </p>
          </div>
        </section>
        <ThreatsPage />
      </main>
      <Footer />
    </div>
  );
}
