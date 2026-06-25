import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Save, X, Loader2, AlertTriangle, Zap, ZapOff } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { useAuth } from "@/lib/auth-context";

interface Challenge {
  id: string;
  name: string;
  difficulty: number;
  category: string;
  scenario: string;
  objectives: string;
  flag: string;
  dynamic_flags: number;
  created_at: number;
}

interface ChallengeFormData {
  name: string;
  difficulty: number;
  category: string;
  scenario: string;
  objectives: string;
  flag: string;
  dynamic_flags: number;
}

const CATEGORIES = ["web", "crypto", "forensics", "reverse", "pwn", "misc"];
const DIFFICULTIES = [
  { value: 1, label: "Easy", color: "text-green-400" },
  { value: 2, label: "Medium", color: "text-yellow-400" },
  { value: 3, label: "Hard", color: "text-orange-400" },
  { value: 4, label: "Expert", color: "text-red-400" },
  { value: 5, label: "Insane", color: "text-purple-400" },
];

const INITIAL_FORM: ChallengeFormData = {
  name: "",
  difficulty: 1,
  category: "web",
  scenario: "",
  objectives: "",
  flag: "",
  dynamic_flags: 0,
};

export function ChallengeAdmin() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChallengeFormData>(INITIAL_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/admin/challenges");
      const data = await res.json();
      if (data.ok) {
        setChallenges(data.challenges);
      }
    } catch (err) {
      console.error("Failed to fetch challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.scenario || !form.flag) {
      setMessage({ type: "error", text: "Name, scenario, and flag are required" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const url = editingId ? `/api/admin/challenges?id=${editingId}` : "/api/admin/challenges";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({
          type: "success",
          text: editingId ? "Challenge updated!" : "Challenge created!",
        });
        setShowForm(false);
        setEditingId(null);
        setForm(INITIAL_FORM);
        fetchChallenges();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save challenge" });
      }
    } catch (err) {
      console.error("Failed to save challenge:", err);
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setForm({
      name: challenge.name,
      difficulty: challenge.difficulty,
      category: challenge.category,
      scenario: challenge.scenario,
      objectives: challenge.objectives,
      flag: challenge.flag,
      dynamic_flags: challenge.dynamic_flags || 0,
    });
    setEditingId(challenge.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this challenge?")) return;
    try {
      const res = await fetch(`/api/admin/challenges?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "Challenge deleted!" });
        fetchChallenges();
      }
    } catch (err) {
      console.error("Failed to delete challenge:", err);
      setMessage({ type: "error", text: "Failed to delete" });
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
            Challenge Management
          </h3>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(INITIAL_FORM);
            }}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-all"
          >
            <Plus size={14} />
            Add Challenge
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
                {editingId ? "Edit Challenge" : "New Challenge"}
              </h4>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Web: SQL Injection"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Flag
                </label>
                <input
                  type="text"
                  value={form.flag}
                  onChange={(e) => setForm({ ...form, flag: e.target.value })}
                  placeholder="CTF{...}"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
              <button
                type="button"
                onClick={() => setForm({ ...form, dynamic_flags: form.dynamic_flags ? 0 : 1 })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.dynamic_flags ? "bg-accent" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.dynamic_flags ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                {form.dynamic_flags ? (
                  <Zap size={14} className="text-accent" />
                ) : (
                  <ZapOff size={14} className="text-muted-foreground" />
                )}
                <div>
                  <div className="text-sm font-medium">Dynamic Flags</div>
                  <div className="text-[11px] text-muted-foreground">
                    {form.dynamic_flags
                      ? "Each user gets a unique flag"
                      : "Same flag for all users"}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Scenario
              </label>
              <textarea
                value={form.scenario}
                onChange={(e) => setForm({ ...form, scenario: e.target.value })}
                placeholder="Describe the challenge scenario..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Objectives (one per line)
              </label>
              <textarea
                value={form.objectives}
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                placeholder="Enumerate the target&#10;Find the vulnerability&#10;Exploit and retrieve flag"
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(INITIAL_FORM);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Name
                </th>
                <th className="text-left py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Category
                </th>
                <th className="text-left py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Difficulty
                </th>
                <th className="text-left py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Flag
                </th>
                <th className="text-left py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Dynamic
                </th>
                <th className="text-right py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => {
                const diff = DIFFICULTIES.find((d) => d.value === c.difficulty);
                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 font-mono text-xs">{c.name}</td>
                    <td className="py-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono uppercase">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`font-mono text-xs ${diff?.color}`}>{diff?.label}</span>
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                      {c.flag}
                    </td>
                    <td className="py-3">
                      {c.dynamic_flags ? (
                        <span className="flex items-center gap-1 text-accent text-xs">
                          <Zap size={12} /> On
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Off</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {challenges.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                    No challenges yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
