import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChallengeSubmit } from "@/components/features/community/ChallengeSubmit";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "CyberAI — Community Challenges" },
      { name: "description", content: "Submit and share CTF challenges with the community" },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="relative z-10 px-4 py-10 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight">Community Challenges</h1>
            <p className="mt-2 text-muted-foreground">
              Submit your own CTF challenges and help the community learn
            </p>
          </div>
          <ChallengeSubmit />
        </div>
      </main>
      <Footer />
    </div>
  );
}
