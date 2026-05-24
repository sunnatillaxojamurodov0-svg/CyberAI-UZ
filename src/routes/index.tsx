import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { Hero } from "@/components/features/landing/Hero";
import { BentoCommand } from "@/components/features/landing/BentoCommand";
import { TrustStrip } from "@/components/features/landing/TrustStrip";
import { CapabilityGrid } from "@/components/features/landing/CapabilityGrid";
import { AssistantTeaser } from "@/components/features/landing/AssistantTeaser";
import { CommunitySection } from "@/components/features/landing/CommunitySection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberAI — Autonomous Defense for the Synthetic Era" },
      { name: "description", content: "Sovereign AI cybersecurity platform. Predictive threat intelligence, conversational defense, and autonomous remediation for high-stakes infrastructure." },
      { property: "og:title", content: "CyberAI — Autonomous Defense for the Synthetic Era" },
      { property: "og:description", content: "Sovereign AI cybersecurity platform. Predictive intelligence, conversational defense, autonomous remediation." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <BentoCommand />
        <TrustStrip />
        <CapabilityGrid />
        <AssistantTeaser />
        <CommunitySection />
      </main>
      <Footer />
    </div>
  );
}
