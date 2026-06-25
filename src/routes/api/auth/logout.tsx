import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { logoutUser, getSessionToken, clearSessionCookie } from "@/lib/auth/auth-server";
import { jsonOk, serverError } from "@/lib/api-response";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (token) {
            await logoutUser(token);
          }
          return jsonOk({}, { "Set-Cookie": clearSessionCookie() });
        } catch (err) {
          return serverError();
        }
      },
    },
  },
});
