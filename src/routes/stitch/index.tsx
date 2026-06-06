import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { StatusPill } from "@/components/shared/StatusPill";
import { useEffect, useState } from "react";

const PROJECT_ID = "16528181881105732096";

interface Screen {
  id: string;
  title: string;
  htmlFile: string | null;
  imageFile: string | null;
}

function groupTitle(title: string): string {
  if (title.startsWith("CyberAI Platform")) return "CyberAI Platform";
  if (title.startsWith("CyberAI - Console")) return "CyberAI Console";
  if (title.startsWith("CyberAI - AI")) return "CyberAI AI & About";
  if (title.startsWith("CyberAI - Threat")) return "Threat Intel Pulse";
  if (title.startsWith("CyberAI - Hall")) return "Hall of Fame";
  if (title.startsWith("Vibe Code")) return "Vibe Code Editor";
  if (title.startsWith("AI Career")) return "AI Career Path";
  if (title.startsWith("About Us")) return "About Us";
  return title;
}

export const Route = createFileRoute("/stitch/")({
  head: () => ({
    meta: [
      { title: "CyberAI — AI-Generated Designs" },
      {
        name: "description",
        content:
          "AI-generated UI designs for CyberAI platform, created with Google Stitch.",
      },
    ],
  }),
  component: StitchGallery,
});

function StitchGallery() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/stitch/${PROJECT_ID}/manifest.json`)
      .then((r) => r.json())
      .then((data) => {
        setScreens(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const grouped = screens.reduce(
    (acc, s) => {
      const key = groupTitle(s.title);
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    },
    {} as Record<string, Screen[]>,
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10">
        <section className="relative overflow-hidden px-6 pt-32 pb-10">
          <AnimatedGrid />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="flex justify-center">
              <StatusPill tone="accent">AI-Generated Designs</StatusPill>
            </div>
            <h1 className="mt-7 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance">
              Stitch Design <span className="gradient-text">Library</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              18 AI-generated UI screens for the CyberAI platform, created with Google Stitch.
              Browse the full design library below.
            </p>
          </div>
        </section>

        <section className="relative px-6 pb-32">
          <div className="mx-auto max-w-7xl">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              Object.entries(grouped).map(([groupName, groupScreens]) => (
                <div key={groupName} className="mb-16 last:mb-0">
                  <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
                    {groupName}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({groupScreens.length} screen{groupScreens.length > 1 ? "s" : ""})
                    </span>
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groupScreens.map((screen) => (
                      <Link
                        key={screen.id}
                        to="/stitch/$screenId"
                        params={{ screenId: screen.id }}
                        className="group relative overflow-hidden rounded-xl border border-border bg-surface transition-all duration-500 hover:border-primary/30 hover:shadow-[0_0_40px_-10px] hover:shadow-primary/20"
                      >
                        <div className="aspect-[9/16] overflow-hidden bg-surface-2">
                          {screen.imageFile ? (
                            <img
                              src={`/stitch/${PROJECT_ID}/${screen.imageFile}`}
                              alt={screen.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                              No preview
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="truncate text-sm font-medium text-foreground/90">
                            {screen.title}
                          </h3>
                          {screen.htmlFile && (
                            <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                              HTML
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
