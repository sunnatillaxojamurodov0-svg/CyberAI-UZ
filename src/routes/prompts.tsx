import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { StatusPill } from "@/components/shared/StatusPill";
import { PromptsShowcase } from "@/components/features/landing/PromptsShowcase";

export const Route = createFileRoute("/prompts")({
  head: () => ({
    meta: [
      { title: "CyberAI — Prompts Library" },
      {
        name: "description",
        content:
          "Browse CyberAI's battle-tested prompt template library for security audit, incident response, threat hunting, code analysis, infrastructure hardening, and compliance.",
      },
      { property: "og:title", content: "CyberAI — Prompts Library" },
      {
        property: "og:description",
        content:
          "Pre-approved prompt templates developed by CyberAI operators. Search, filter, and copy for your environment.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/prompts" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/prompts" }],
  }),
  component: PromptsRoute,
});

function PromptsRoute() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10">
        <section className="relative overflow-hidden px-6 pt-32 pb-10">
          <AnimatedGrid />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="flex justify-center">
              <StatusPill tone="accent">Prompts Library</StatusPill>
            </div>
            <h1 className="mt-7 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance">
              Speak to your infrastructure with{" "}
              <span className="gradient-text">precision.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Every prompt is battle-tested by CyberAI operators. Filter by category, search by keyword, and copy any template directly to your clipboard.
            </p>
          </div>
        </section>
        <PromptsShowcase />
      </main>
      <Footer />
    </div>
  );
}
