import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { useEffect, useState, useRef } from "react";

const PROJECT_ID = "16528181881105732096";

interface Screen {
  id: string;
  title: string;
  htmlFile: string | null;
  imageFile: string | null;
}

export const Route = createFileRoute("/stitch/$screenId")({
  head: ({ params }) => ({
    meta: [
      {
        title: `CyberAI — Screen ${params.screenId.slice(0, 8)}`,
      },
    ],
  }),
  component: ScreenDetail,
});

function ScreenDetail() {
  const { screenId } = Route.useParams();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [allScreens, setAllScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showHtml, setShowHtml] = useState(false);

  useEffect(() => {
    fetch(`/stitch/${PROJECT_ID}/manifest.json`)
      .then((r) => r.json())
      .then((data: Screen[]) => {
        setAllScreens(data);
        const found = data.find((s) => s.id === screenId);
        setScreen(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [screenId]);

  const currentIndex = allScreens.findIndex((s) => s.id === screenId);
  const prevScreen = currentIndex > 0 ? allScreens[currentIndex - 1] : null;
  const nextScreen =
    currentIndex < allScreens.length - 1
      ? allScreens[currentIndex + 1]
      : null;

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <CursorSpotlight />
        <Navbar />
        <main className="flex items-center justify-center pt-32">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <CursorSpotlight />
        <Navbar />
        <main className="flex flex-col items-center justify-center pt-32 text-center">
          <h1 className="text-2xl font-bold text-foreground">Screen not found</h1>
          <Link
            to="/stitch"
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to gallery
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10 pt-24">
        <div className="mx-auto max-w-7xl px-6 pb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link
                to="/stitch"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                &larr; Back to gallery
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-foreground">
                {screen.title}
              </h1>
              <p className="text-sm text-muted-foreground">ID: {screen.id}</p>
            </div>
            <div className="flex items-center gap-3">
              {screen.htmlFile && (
                <button
                  onClick={() => setShowHtml(!showHtml)}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                >
                  {showHtml ? "Show Preview" : "Show HTML"}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4 pb-6">
            <div>
              {prevScreen ? (
                <Link
                  to="/stitch/$screenId"
                  params={{ screenId: prevScreen.id }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  &larr; {prevScreen.title}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground/40">&larr; Previous</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {allScreens.length}
            </span>
            <div>
              {nextScreen ? (
                <Link
                  to="/stitch/$screenId"
                  params={{ screenId: nextScreen.id }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {nextScreen.title} &rarr;
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground/40">Next &rarr;</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {showHtml && screen.htmlFile ? (
              <iframe
                ref={iframeRef}
                src={`/stitch/${PROJECT_ID}/${screen.htmlFile}`}
                className="h-[80vh] w-full"
                title={screen.title}
              />
            ) : screen.imageFile ? (
              <div className="flex justify-center bg-surface-2 p-4">
                <img
                  src={`/stitch/${PROJECT_ID}/${screen.imageFile}`}
                  alt={screen.title}
                  className="max-h-[80vh] w-auto rounded-lg shadow-2xl"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No preview available
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
