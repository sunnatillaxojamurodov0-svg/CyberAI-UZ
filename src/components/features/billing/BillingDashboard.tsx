import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Check, ExternalLink, Loader2 } from "lucide-react";

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd: number;
}

interface BillingInfo {
  ok: boolean;
  subscription: Subscription | null;
  plan: string;
  limits: {
    aiMessagesPerDay: number;
    challengesPerDay: number;
    maxHistory: number;
    maxTokensPerDay: number;
  };
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
}

export function BillingDashboard() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/billing")
        .then((res) => res.json())
        .then((data: BillingInfo) => setBilling(data))
        .catch((err) => {
          console.error("Failed to fetch billing info:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to manage subscription:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load billing information
      </div>
    );
  }

  const planColors: Record<string, string> = {
    free: "text-muted-foreground",
    pro: "text-primary",
    enterprise: "text-yellow-500",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Current Plan</h3>
          {billing.subscription?.status === "active" && billing.plan !== "free" && (
            <button
              onClick={handleManageSubscription}
              disabled={actionLoading}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Manage Subscription
            </button>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className={`text-3xl font-bold capitalize ${planColors[billing.plan] || ""}`}>
            {billing.plan}
          </span>
          {billing.subscription?.currentPeriodEnd && (
            <span className="text-sm text-muted-foreground">
              Renews {new Date(billing.subscription.currentPeriodEnd * 1000).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="text-sm text-muted-foreground mb-1">AI Messages</div>
            <div className="text-lg font-semibold">
              {billing.limits.aiMessagesPerDay === -1
                ? "Unlimited"
                : `${billing.limits.aiMessagesPerDay}/day`}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="text-sm text-muted-foreground mb-1">AI Tokens</div>
            <div className="text-lg font-semibold">
              {billing.limits.maxTokensPerDay === -1
                ? "Unlimited"
                : `${(billing.limits.maxTokensPerDay / 1000).toFixed(0)}K/day`}
            </div>
            {billing.tokenUsage && (
              <div className="text-xs text-muted-foreground mt-1">
                Used: {(billing.tokenUsage.totalTokens / 1000).toFixed(1)}K
              </div>
            )}
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="text-sm text-muted-foreground mb-1">CTF Challenges</div>
            <div className="text-lg font-semibold">
              {billing.limits.challengesPerDay === -1
                ? "Unlimited"
                : `${billing.limits.challengesPerDay}/day`}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="text-sm text-muted-foreground mb-1">Chat History</div>
            <div className="text-lg font-semibold">
              {billing.limits.maxHistory === -1
                ? "Unlimited"
                : `${billing.limits.maxHistory} messages`}
            </div>
          </div>
        </div>
      </div>

      {billing.plan === "free" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Upgrade to Pro</h3>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              Unlimited AI messages
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              Unlimited CTF challenges
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              Custom AI models
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              API access
            </li>
          </ul>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}
