import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { ProgressiveBlur } from "@/components/shared/ProgressiveBlur";
import { ChatPage } from "@/components/features/chat/ChatPage";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "CyberAI — Assistant" },
      {
        name: "description",
        content:
          "Interact with your infrastructure through CyberAI's intelligent assistant. Scan, ask, and command in natural language.",
      },
      { property: "og:title", content: "CyberAI — Assistant" },
      {
        property: "og:description",
        content:
          "Autonomous infrastructure defense through natural language commands. Real-time threat scanning, querying, and remediation.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://app.cyberaiuz.workers.dev/chat" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://app.cyberaiuz.workers.dev/chat" }],
  }),
  component: ChatRoute,
});

function ChatRoute() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <ProgressiveBlur position="top" />
      <ProgressiveBlur position="bottom" />
      <Navbar />
      <main className="relative z-10 pt-16 h-[calc(100vh-4rem)]">
        <ChatPage />
      </main>
      <Footer />
    </div>
  );
}
