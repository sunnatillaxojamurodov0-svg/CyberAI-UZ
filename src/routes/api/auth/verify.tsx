import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { verifyEmail } from "@/lib/auth/auth-server";
import { jsonOk, jsonError, serverError } from "@/lib/api-response";

export const Route = createFileRoute("/api/auth/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          if (!token) {
            return jsonError("Token is required.");
          }

          const result = await verifyEmail(token);

          if (!result.ok) {
            return jsonError(result.error ?? "Verification failed.");
          }

          return jsonOk({ message: "Email verified successfully." });
        } catch (err) {
          return serverError();
        }
      },
    },
  },
});
