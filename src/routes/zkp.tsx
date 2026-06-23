import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { StatusPill } from "@/components/shared/StatusPill";
import { ZKPPage } from "@/components/features/zkp/ZKPPage";

export const Route = createFileRoute("/zkp")({
  head: () => ({
    meta: [
      { title: "CyberAI — Zero-Knowledge Proofs" },
      {
        name: "description",
        content: "Prove you solved a challenge without revealing the flag. Cryptographic verification of CTF solutions.",
      },
      { property: "og:title", content: "CyberAI — Zero-Knowledge Proofs" },
      { property: "og:description", content: "Cryptographic proof of CTF solutions." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/zkp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/zkp" }],
  }),
  component: ZKPRoute,
});

function ZKPRoute() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10">
        <section className="relative overflow-hidden px-6 pt-32 pb-10">
          <AnimatedGrid />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="flex justify-center">
              <StatusPill tone="accent">Zero-Knowledge Proofs</StatusPill>
            </div>
            <h1 className="mt-7 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance">
              Prove without <span className="gradient-text">revealing.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Generate cryptographic proofs that you solved a challenge without exposing the flag.
              Verify solutions without trust.
            </p>
          </div>
        </section>
        <ZKPPage />
      </main>
      <Footer />
    </div>
  );
}
