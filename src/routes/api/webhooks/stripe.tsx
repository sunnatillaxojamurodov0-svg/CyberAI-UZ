import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/db";
import { handleWebhook } from "@/lib/stripe";

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET as string;

          if (!stripeWebhookSecret) {
            return new Response("Webhook not configured", { status: 503 });
          }

          const signature = request.headers.get("stripe-signature");
          if (!signature) {
            return new Response("Missing stripe-signature header", { status: 400 });
          }

          const payload = await request.text();
          const result = await handleWebhook(payload, signature);

          return new Response(
            JSON.stringify({ received: true, type: result.type, processed: result.processed }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          console.error("Stripe webhook error:", err);
          return new Response(JSON.stringify({ error: "Webhook error" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
