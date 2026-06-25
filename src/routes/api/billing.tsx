import { createFileRoute } from "@tanstack/react-router";
import {
  createCheckoutSession,
  createPortalSession,
  getUserSubscription,
  getPlanLimits,
} from "@/lib/stripe";
import { getTokenUsage } from "@/lib/auth/ai-quota";
import { jsonOk, jsonError, unauthorizedError, serverError } from "@/lib/api-response";
import { requireAuth, isAuthResponse } from "@/lib/api-middleware";

export const Route = createFileRoute("/api/billing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const subscription = await getUserSubscription(auth.user.id);
          const plan = subscription?.plan || "free";
          const limits = getPlanLimits(plan);
          const tokenUsage = await getTokenUsage(auth.user.id);

          return jsonOk({ subscription, plan, limits, tokenUsage });
        } catch (err) {
          console.error("Billing API error:", err);
          return serverError();
        }
      },

      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const body = (await request.json()) as {
            action: "checkout" | "portal" | "subscription";
            plan?: "pro" | "enterprise";
          };

          const userId = auth.user.id;
          const origin = new URL(request.url).origin;

          if (body.action === "checkout" && body.plan) {
            const result = await createCheckoutSession(
              userId,
              body.plan,
              `${origin}/dashboard?upgraded=true`,
              `${origin}/dashboard?upgrade_cancelled=true`,
            );
            return jsonOk({ url: result.url });
          }

          if (body.action === "portal") {
            const result = await createPortalSession(userId, `${origin}/dashboard`);
            return jsonOk({ url: result.url });
          }

          if (body.action === "subscription") {
            const subscription = await getUserSubscription(userId);
            return jsonOk({ subscription });
          }

          return jsonError("Invalid action");
        } catch (err) {
          console.error("Billing API error:", err);
          return serverError();
        }
      },
    },
  },
});
