import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Check, Zap, Shield, Building2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Shield,
    features: [
      "50 AI messages/day",
      "3 CTF challenges/day",
      "Basic leaderboard",
      "Community support",
    ],
    plan: "free" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    icon: Zap,
    features: [
      "Unlimited AI messages",
      "Unlimited CTF challenges",
      "Priority support",
      "Custom AI models",
      "API access",
      "Advanced analytics",
    ],
    plan: "pro" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    icon: Building2,
    features: [
      "Everything in Pro",
      "Custom deployment",
      "Dedicated support",
      "SLA guarantee",
      "Team management",
      "Custom integrations",
      "Audit logs",
    ],
    plan: "enterprise" as const,
    popular: false,
  },
];

export function PricingSection() {
  const { user, openAuthModal } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: "pro" | "enterprise") => {
    if (!user) {
      openAuthModal();
      return;
    }

    setLoading(plan);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", plan }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Choose Your Plan
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Scale your cybersecurity skills with the plan that fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? "border-primary bg-primary/5 shadow-[0_0_40px_-10px] shadow-primary/20"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${plan.popular ? "bg-primary/10" : "bg-muted"}`}>
                  <plan.icon
                    className={`w-5 h-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.plan === "free" ? (
                <button
                  onClick={() => openAuthModal()}
                  className="w-full py-3 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Get Started
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.plan)}
                  disabled={loading === plan.plan}
                  className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {loading === plan.plan ? "Loading..." : "Upgrade"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
