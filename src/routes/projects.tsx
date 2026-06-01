import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { StatusPill } from "@/components/shared/StatusPill";
import { ProjectsShowcase } from "@/components/features/landing/ProjectsShowcase";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "CyberAI — Projects" },
      {
        name: "description",
        content:
          "Explore CyberAI's sovereign infrastructure projects. Orbital Sentinel, Cyber-Pilot, Policy Mesh, Neural Topology, and Incident Playbooks.",
      },
      { property: "og:title", content: "CyberAI — Projects" },
      {
        property: "og:description",
        content:
          "Sovereign infrastructure for the autonomous era. Explore every CyberAI project — built for silent strength at machine speed.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/projects" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  component: ProjectsRoute,
});

function ProjectsRoute() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10">
        <section className="relative overflow-hidden px-6 pt-32 pb-10">
          <AnimatedGrid />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="flex justify-center">
              <StatusPill tone="accent">Project Portfolio</StatusPill>
            </div>
            <h1 className="mt-7 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance">
              Infrastructure you can trust{" "}
              <span className="gradient-text">at machine speed.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Every project here is built, tested, and running in production. Click any card for deep architecture breakdowns, metrics, and capability distribution.
            </p>
          </div>
        </section>
        <ProjectsShowcase />
      </main>
      <Footer />
    </div>
  );
}
