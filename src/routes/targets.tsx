import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { StatusPill } from "@/components/shared/StatusPill";
import { TargetsPage } from "@/components/features/targets/TargetsPage";

export const Route = createFileRoute("/targets")({
  head: () => ({
    meta: [
      { title: "CyberAI — Live Cloud Targets" },
      {
        name: "description",
        content:
          "Spin up isolated, realistic vulnerable networks in seconds. No local VMs required.",
      },
      { property: "og:title", content: "CyberAI — Live Cloud Targets" },
      {
        property: "og:description",
        content: "Real-time vulnerable environments for hands-on practice.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/targets" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/targets" }],
  }),
  component: TargetsRoute,
});

function TargetsRoute() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10">
        <section className="relative overflow-hidden px-6 pt-32 pb-10">
          <AnimatedGrid />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="flex justify-center">
              <StatusPill tone="accent">Live Cloud Targets</StatusPill>
            </div>
            <h1 className="mt-7 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance">
              Spin up <span className="gradient-text">real targets.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Launch isolated, realistic vulnerable networks in seconds. Practice on real
              infrastructure without setting up local VMs.
            </p>
          </div>
        </section>
        <TargetsPage />
      </main>
      <Footer />
    </div>
  );
}
