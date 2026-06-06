import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { AboutHero } from "@/components/features/about/AboutHero";
import { OriginStory } from "@/components/features/about/OriginStory";
import { Mission } from "@/components/features/about/Mission";
import { Timeline } from "@/components/features/about/Timeline";
import { Values } from "@/components/features/about/Values";
import { TechStack } from "@/components/features/about/TechStack";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CyberAI — Sovereign Defense Foundation Document" },
      {
        name: "description",
        content:
          "The CyberAI story: founded by intelligence operators and AI researchers to build autonomous, sovereign defense for high-stakes infrastructure.",
      },
      { property: "og:title", content: "About CyberAI — Sovereign Defense Foundation Document" },
      {
        property: "og:description",
        content:
          "Built for when the alert sounds. The mission, timeline, and operational doctrine behind CyberAI.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10">
        <AboutHero />
        <OriginStory />
        <Mission />
        <Timeline />
        <Values />
        <TechStack />
      </main>
      <Footer />
    </div>
  );
}
