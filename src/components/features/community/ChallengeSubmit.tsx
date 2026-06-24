import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, Plus } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { useAuth } from "@/lib/auth-context";

interface SubmittedChallenge {
  id: string;
  name: string;
  category: string;
  difficulty: number;
  scenario: string;
  objectives: string;
  flag: string;
  status: "pending" | "approved" | "rejected";
  submitted_by: string;
  review_notes: string;
  created_at: number;
}

const CATEGORIES = ["web", "crypto", "forensics", "reverse", "pwn", "misc"];
const DIFFICULTIES = [
  { value: 1, label: "Easy" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Hard" },
  { value: 4, label: "Expert" },
  { value: 5, label: "Insane" },
];

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Pending Review" },
  approved: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Rejected" },
};

export function ChallengeSubmit() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmittedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "web",
    difficulty: 1,
    scenario: "",
    objectives: "",
    flag: "",
    hints: "",
    writeup: "",
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/challenges/submit");
      const data = await res.json();
      if (data.ok) {
        setSubmissions(data.submissions);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.scenario || !form.flag) {
      setMessage({ type: "error", text: "Name, scenario, and flag are required" });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "Challenge submitted for review!" });
        setShowForm(false);
        setForm({ name: "", category: "web", difficulty: 1, scenario: "", objectives: "", flag: "", hints: "", writeup: "" });
        fetchSubmissions();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to submit" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "border border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
              : "border border-destructive/20 bg-destructive/5 text-destructive"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Your Submissions
          </h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-all"
          >
            <Plus size={14} />
            Submit Challenge
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 rounded-lg border border-border bg-surface/50 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Submit New Challenge
              </h4>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Web: SQL Injection Challenge"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
                >
                  {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Flag *</label>
                <input
                  type="text"
                  value={form.flag}
                  onChange={(e) => setForm({ ...form, flag: e.target.value })}
                  placeholder="CTF{...}"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Scenario *</label>
              <textarea
                value={form.scenario}
                onChange={(e) => setForm({ ...form, scenario: e.target.value })}
                placeholder="Describe the challenge scenario, target, and environment..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Objectives (one per line)</label>
              <textarea
                value={form.objectives}
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                placeholder="Enumerate the target&#10;Find the vulnerability&#10;Exploit and retrieve flag"
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Hints (optional, one per line)</label>
              <textarea
                value={form.hints}
                onChange={(e) => setForm({ ...form, hints: e.target.value })}
                placeholder="Look at the login form&#10;Check for input validation"
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Writeup / Solution (optional)</label>
              <textarea
                value={form.writeup}
                onChange={(e) => setForm({ ...form, writeup: e.target.value })}
                placeholder="Step-by-step solution for reviewers..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit for Review
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {submissions.map((sub) => {
            const statusConfig = STATUS_CONFIG[sub.status];
            const StatusIcon = statusConfig.icon;
            return (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface/30 hover:bg-surface/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{sub.name}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase">{sub.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{sub.scenario}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono ${statusConfig.bg} ${statusConfig.color}`}>
                    <StatusIcon size={10} />
                    {statusConfig.label}
                  </span>
                  {sub.review_notes && (
                    <span className="text-xs text-muted-foreground max-w-[200px] truncate" title={sub.review_notes}>
                      {sub.review_notes}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {submissions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No submissions yet. Be the first to contribute!
            </div>
          )}
        </div>
      </GlassPanel>
    </motion.div>
  );
}
