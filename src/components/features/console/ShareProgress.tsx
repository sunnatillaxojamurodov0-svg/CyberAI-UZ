import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Share2, Download, Copy, Check, X } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { useAuth } from "@/lib/auth-context";
import type { CTFChallenge } from "@/lib/console/types";

interface ShareProgressProps {
  solved: CTFChallenge[];
  totalPoints: number;
  level: number;
}

export function ShareProgress({ solved, totalPoints, level }: ShareProgressProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const solvedCount = solved.length;
  const categories = [...new Set(solved.map((c) => c.category))];
  const avgScore =
    solved.length > 0
      ? Math.round(solved.reduce((sum, c) => sum + c.difficulty * 20, 0) / solved.length)
      : 0;

  const generateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0a0e17");
    gradient.addColorStop(1, "#1a1f2e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid pattern
    ctx.strokeStyle = "rgba(0, 255, 170, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // CyberAI logo text
    ctx.fillStyle = "#00ffaa";
    ctx.font = "bold 32px monospace";
    ctx.fillText("CYBERAI", 50, 80);

    // User info
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px monospace";
    ctx.fillText(`@${user?.name || "hacker"}`, 50, 120);

    // Stats
    ctx.fillStyle = "#00ffaa";
    ctx.font = "bold 72px monospace";
    ctx.fillText(`${solvedCount}`, 50, 220);
    ctx.fillStyle = "#888";
    ctx.font = "18px monospace";
    ctx.fillText("challenges solved", 200, 220);

    ctx.fillStyle = "#00ffaa";
    ctx.font = "bold 48px monospace";
    ctx.fillText(`${totalPoints}`, 50, 300);
    ctx.fillStyle = "#888";
    ctx.font = "18px monospace";
    ctx.fillText("points earned", 180, 300);

    // Level progress
    const levelProgress = Math.min((solvedCount / 70) * 100, 100);
    ctx.fillStyle = "#1a1f2e";
    ctx.fillRect(50, 350, 500, 20);
    ctx.fillStyle = "#00ffaa";
    ctx.fillRect(50, 350, (levelProgress / 100) * 500, 20);
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.fillText(`Level ${level} · ${Math.round(levelProgress)}% complete`, 50, 390);

    // Categories
    ctx.fillStyle = "#00ffaa";
    ctx.font = "bold 16px monospace";
    ctx.fillText("CATEGORIES:", 700, 80);
    ctx.fillStyle = "#ccc";
    ctx.font = "14px monospace";
    categories.forEach((cat, i) => {
      ctx.fillText(`• ${cat}`, 700, 110 + i * 25);
    });

    // Bottom text
    ctx.fillStyle = "#555";
    ctx.font = "12px monospace";
    ctx.fillText("app.cyberaiuz.workers.dev", 50, canvas.height - 30);
  };

  const handleDownload = async () => {
    await generateCard();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `cyberai-progress-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyStats = async () => {
    const text =
      `🛡️ CyberAI Progress\n\n` +
      `🎯 ${solvedCount} challenges solved\n` +
      `💰 ${totalPoints} points earned\n` +
      `📊 Level ${level}\n` +
      `🏷️ Categories: ${categories.join(", ")}\n\n` +
      `#CyberAI #CTF #InfoSec`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-all"
      >
        <Share2 size={14} />
        Share Progress
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel className="p-6 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold">Share Your Progress</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-surface/50 p-4 text-center">
                    <div className="font-display text-3xl font-bold text-accent">{solvedCount}</div>
                    <div className="text-xs text-muted-foreground">Challenges Solved</div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface/50 p-4 text-center">
                    <div className="font-display text-3xl font-bold text-accent">{totalPoints}</div>
                    <div className="text-xs text-muted-foreground">Total Points</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-all"
                  >
                    <Download size={16} />
                    Download Image
                  </button>
                  <button
                    onClick={handleCopyStats}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-surface transition-all"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied!" : "Copy Stats"}
                  </button>
                </div>

                <canvas ref={canvasRef} className="hidden" />
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
