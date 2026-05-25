import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { AboutHero } from "@/components/features/about/AboutHero";
import { OriginStory } from "@/components/features/about/OriginStory";
import { Mission } from "@/components/features/about/Mission";
import { Timeline } from "@/components/features/about/Timeline";
import { Values } from "@/components/features/about/Values";
import { AboutCTA } from "@/components/features/about/AboutCTA";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CyberAI — Origin Document for Sovereign Defense" },
      {
        name: "description",
        content:
          "The CyberAI story: founded by intelligence operators and AI researchers to build autonomous, sovereign defense for high-stakes infrastructure.",
      },
      { property: "og:title", content: "About CyberAI — Origin Document for Sovereign Defense" },
      {
        property: "og:description",
        content:
          "Built for the moment after the alarm. The mission, timeline, and operating doctrine behind CyberAI.",
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
        <AboutCTA />
      </main>
      <Footer />
    </div>
  );
}
