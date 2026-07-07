import { requireAuth, requireAdminAuth } from "./auth-server";
import type { AuthUser } from "./auth-server";

type RequestContext = { request: Request };
export type WithAuthContext = RequestContext & { user: AuthUser };
type HandlerFn = (ctx: WithAuthContext) => Response | Promise<Response>;

export function withAuth(handler: HandlerFn) {
  return async (ctx: RequestContext): Promise<Response> => {
    const result = await requireAuth(ctx.request);
    if (!result.ok) return result.response;
    return handler({ request: result.request, user: result.user });
  };
}

export function withAdmin(handler: HandlerFn) {
  return async (ctx: RequestContext): Promise<Response> => {
    const result = await requireAdminAuth(ctx.request);
    if (!result.ok) return result.response;
    return handler({ request: result.request, user: result.user });
  };
}
