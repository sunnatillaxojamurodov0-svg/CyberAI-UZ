/** CSP and HTML nonce helpers for the Cloudflare Worker entry. */

export function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://*.googleusercontent.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
    `connect-src 'self' https://api.github.com`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
  ].join("; ");
}

/** Add CSP nonce to inline script and style tags in SSR HTML. */
export function injectNonceIntoHtml(html: string, nonce: string): string {
  const safeNonce = nonce.replace(/"/g, "");

  // Inject nonce into script tags
  let result = html.replace(/<script\b([^>]*)>/gi, (full, attrs: string) => {
    if (/\bnonce\s*=/.test(attrs)) return full;
    return `<script nonce="${safeNonce}"${attrs}>`;
  });

  // Inject nonce into style tags
  result = result.replace(/<style\b([^>]*)>/gi, (full, attrs: string) => {
    if (/\bnonce\s*=/.test(attrs)) return full;
    return `<style nonce="${safeNonce}"${attrs}>`;
  });

  return result;
}

export function buildSecurityHeaders(nonce: string, isApiRoute: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": buildCSP(nonce),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=(), join-ad-interest-group=(), run-ad-auction=(), interest-cohort=()",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Embedder-Policy": "credentialless",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-DNS-Prefetch-Control": "off",
    "X-Download-Options": "noopen",
    "X-XSS-Protection": "1; mode=block",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    "Surrogate-Control": "no-store",
  };

  if (isApiRoute) {
    headers["Cross-Origin-Opener-Policy"] = "unsafe-none";
    headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
  } else {
    headers["Cross-Origin-Opener-Policy"] = "same-origin";
  }

  return headers;
}
