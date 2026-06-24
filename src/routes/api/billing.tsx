import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { createCheckoutSession, createPortalSession, getUserSubscription, getPlanLimits } from "@/lib/stripe";
import { getTokenUsage } from "@/lib/auth/ai-quota";

export const Route = createFileRoute("/api/billing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;

          if (!session?.ok || !session.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const subscription = await getUserSubscription(session.user.id);
          const plan = subscription?.plan || "free";
          const limits = getPlanLimits(plan);
          const tokenUsage = await getTokenUsage(session.user.id);

          return new Response(JSON.stringify({
            ok: true,
            subscription,
            plan,
            limits,
            tokenUsage,
          }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Billing API error:", err);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      POST: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;

          if (!session?.ok || !session.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as {
            action: "checkout" | "portal" | "subscription";
            plan?: "pro" | "enterprise";
          };

          const userId = session.user.id;
          const origin = new URL(request.url).origin;

          if (body.action === "checkout" && body.plan) {
            const result = await createCheckoutSession(
              userId,
              body.plan,
              `${origin}/dashboard?upgraded=true`,
              `${origin}/dashboard?upgrade_cancelled=true`,
            );
            return new Response(JSON.stringify({ ok: true, url: result.url }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          if (body.action === "portal") {
            const result = await createPortalSession(userId, `${origin}/dashboard`);
            return new Response(JSON.stringify({ ok: true, url: result.url }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          if (body.action === "subscription") {
            const subscription = await getUserSubscription(userId);
            return new Response(JSON.stringify({ ok: true, subscription }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Billing API error:", err);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
