import { describe, it, expect, vi } from "vitest";
import { withAuth, withAdmin } from "./middleware";

describe("withAuth", () => {
  it("returns 401 for unauthenticated request", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const res = await wrapped({ request: new Request("http://localhost/api/test") });
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 with no cookie header", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const res = await wrapped({ request: new Request("http://localhost/api/test", { headers: {} }) });
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("withAdmin", () => {
  it("returns 401 for unauthenticated request", async () => {
    const handler = vi.fn();
    const wrapped = withAdmin(handler);
    const res = await wrapped({ request: new Request("http://localhost/api/test") });
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});
