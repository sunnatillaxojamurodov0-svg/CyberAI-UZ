import { useState } from "react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface ZKPProof {
  id: string;
  proof_hash: string;
  public_input: string;
  created_at: number;
  verified: boolean;
}

export function ZKPPage() {
  const { user } = useAuth();
  const [challengeId, setChallengeId] = useState("");
  const [flag, setFlag] = useState("");
  const [showFlag, setShowFlag] = useState(false);
  const [proof, setProof] = useState<ZKPProof | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<ZKPProof | null>(null);

  const generateProof = async () => {
    if (!user) {
      alert("Please sign in to generate proofs");
      return;
    }

    if (!challengeId || !flag) {
      setError("Challenge ID and flag are required");
      return;
    }

    setLoading(true);
    setError(null);
    setProof(null);

    try {
      const res = await fetch("/api/zkp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challenge_id: challengeId,
          flag: flag,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setProof(json.data);
      } else {
        setError(json.error ?? "Failed to generate proof");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const verifyProof = async () => {
    if (!verifyId) {
      setError("Proof ID required");
      return;
    }

    setLoading(true);
    setError(null);
    setVerifyResult(null);

    try {
      const res = await fetch(`/api/zkp?id=${verifyId}`);
      const json = await res.json();
      if (json.ok) {
        setVerifyResult(json.data);
      } else {
        setError(json.error ?? "Proof not found");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Mode Toggle */}
      <div className="mb-8 flex justify-center">
        <div className="flex rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setVerifyMode(false)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2.5 font-mono text-xs font-bold transition-all",
              !verifyMode ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Lock size={14} />
            Generate Proof
          </button>
          <button
            type="button"
            onClick={() => setVerifyMode(true)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2.5 font-mono text-xs font-bold transition-all",
              verifyMode ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Unlock size={14} />
            Verify Proof
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <GlassPanel className="mb-8 border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-3 text-red-400">
            <XCircle size={16} />
            <span className="font-mono text-sm">{error}</span>
          </div>
        </GlassPanel>
      )}

      {/* Generate Mode */}
      {!verifyMode && (
        <GlassPanel className="p-6">
          <h3 className="mb-4 font-mono text-sm font-bold text-foreground">
            Generate Zero-Knowledge Proof
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Prove you solved a challenge without revealing the flag. The proof is a cryptographic
            hash that can be verified without exposing the original solution.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Challenge ID
              </label>
              <input
                value={challengeId}
                onChange={(e) => setChallengeId(e.target.value)}
                placeholder="e.g., l1-01-recon, l2-05-web"
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent/40"
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Flag
              </label>
              <div className="relative">
                <input
                  type={showFlag ? "text" : "password"}
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder="CYBERAI{...}"
                  className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 pr-12 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent/40"
                />
                <button
                  type="button"
                  onClick={() => setShowFlag(!showFlag)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showFlag ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={generateProof}
              disabled={loading || !challengeId || !flag}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-mono text-sm font-bold transition-all",
                loading
                  ? "bg-accent/20 text-accent"
                  : "bg-accent text-white shadow-[0_0_18px_-6px] shadow-accent/50 hover:brightness-110 disabled:opacity-40 disabled:shadow-none",
              )}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Generate Proof
                </>
              )}
            </button>
          </div>

          {/* Generated Proof */}
          {proof && (
            <div className="mt-6 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-emerald-300">
                    Proof Generated Successfully
                  </h4>
                  <p className="font-mono text-[10px] text-emerald-400/70">
                    Cryptographic hash of your solution
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Proof ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs text-foreground">
                      {proof.id}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(proof.id)}
                      className="rounded-lg border border-border bg-surface p-2 text-muted-foreground hover:text-foreground"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Proof Hash
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 overflow-hidden text-ellipsis rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs text-foreground">
                      {proof.proof_hash}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(proof.proof_hash)}
                      className="rounded-lg border border-border bg-surface p-2 text-muted-foreground hover:text-foreground"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    Share this Proof ID to let others verify your solution without revealing the
                    flag.
                  </p>
                </div>
              </div>
            </div>
          )}
        </GlassPanel>
      )}

      {/* Verify Mode */}
      {verifyMode && (
        <GlassPanel className="p-6">
          <h3 className="mb-4 font-mono text-sm font-bold text-foreground">
            Verify Zero-Knowledge Proof
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Enter a Proof ID to verify that someone solved a challenge without exposing the flag.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Proof ID
              </label>
              <input
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                placeholder="zkp_..."
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent/40"
              />
            </div>

            <button
              type="button"
              onClick={verifyProof}
              disabled={loading || !verifyId}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-mono text-sm font-bold transition-all",
                loading
                  ? "bg-accent/20 text-accent"
                  : "bg-accent text-white shadow-[0_0_18px_-6px] shadow-accent/50 hover:brightness-110 disabled:opacity-40 disabled:shadow-none",
              )}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Unlock size={14} />
                  Verify Proof
                </>
              )}
            </button>
          </div>

          {/* Verification Result */}
          {verifyResult && (
            <div className="mt-6 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15">
                  <Shield size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-emerald-300">
                    Proof Verified
                  </h4>
                  <p className="font-mono text-[10px] text-emerald-400/70">
                    Cryptographic proof is valid
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Challenge:</span>
                  <span className="font-mono text-xs text-foreground">
                    {verifyResult.public_input}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Created:</span>
                  <span className="font-mono text-xs text-foreground">
                    {new Date(verifyResult.created_at * 1000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Status:</span>
                  <StatusPill tone="emerald">Verified</StatusPill>
                </div>
              </div>
            </div>
          )}
        </GlassPanel>
      )}

      {/* Info Section */}
      <GlassPanel className="mt-8 p-6">
        <h3 className="mb-3 font-mono text-sm font-bold text-foreground">
          How Zero-Knowledge Proofs Work
        </h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            A zero-knowledge proof allows you to prove that you know something (like a CTF flag)
            without revealing the actual information.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center gap-2">
                <Lock size={14} className="text-accent" />
                <span className="font-mono text-xs font-bold text-foreground">1. Generate</span>
              </div>
              <p className="text-xs">
                Enter your flag and challenge ID. We create a cryptographic hash that uniquely
                represents your solution.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center gap-2">
                <Shield size={14} className="text-accent" />
                <span className="font-mono text-xs font-bold text-foreground">2. Share</span>
              </div>
              <p className="text-xs">
                Share the Proof ID with others. They can verify your solution without seeing the
                actual flag.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-accent" />
                <span className="font-mono text-xs font-bold text-foreground">3. Verify</span>
              </div>
              <p className="text-xs">
                Others can use the Proof ID to verify that you solved the challenge without
                revealing the flag.
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
