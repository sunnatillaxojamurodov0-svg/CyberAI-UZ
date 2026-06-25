type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function jsonResponse(
  data: Record<string, unknown>,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export function jsonOk(
  data: Record<string, unknown> = {},
  extraHeaders?: Record<string, string>,
): Response {
  return jsonResponse({ ok: true, ...data }, 200, extraHeaders);
}

export function jsonCreated(
  data: Record<string, unknown> = {},
  extraHeaders?: Record<string, string>,
): Response {
  return jsonResponse({ ok: true, ...data }, 201, extraHeaders);
}

export function jsonError(error: string, status = 400, extra?: Record<string, unknown>): Response {
  return jsonResponse({ ok: false, error, ...extra }, status);
}

export function unauthorizedError(error = "Unauthorized"): Response {
  return jsonError(error, 401);
}

export function serverError(error = "Internal server error"): Response {
  return jsonError(error, 500);
}

export function rateLimitError(error = "Too many requests. Try again later."): Response {
  return jsonError(error, 429);
}

export function textResponse(
  text: string,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain", ...extraHeaders },
  });
}

export function textError(text: string, status = 400): Response {
  return textResponse(text, status);
}

export function serviceUnavailableText(text: string): Response {
  return textResponse(text, 503);
}

export function catchError(err: unknown, fallbackMessage: string): Response {
  return jsonResponse(
    { ok: false, error: err instanceof Error ? err.message : fallbackMessage },
    500,
  );
}
