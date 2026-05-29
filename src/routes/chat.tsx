import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { ChatPage } from "@/components/features/chat/ChatPage";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "CyberAI — Assistant" },
      {
        name: "description",
        content:
          "Communicate with your infrastructure through CyberAI's intelligent assistant. Scan, query, and command in natural language.",
      },
      { property: "og:title", content: "CyberAI — Assistant" },
      {
        property: "og:description",
        content:
          "Autonomous infrastructure defense through natural language commands. Real-time threat scanning, query, and remediation.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/chat" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/chat" }],
  }),
  component: ChatRoute,
});

function ChatRoute() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10">
        <ChatPage />
      </main>
      <Footer />
    </div>
  );
}
