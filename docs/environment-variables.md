# Environment Variables Reference

## Overview

Complete reference for all environment variables used in the CyberAI platform.

## Quick Start

```bash
# 1. Copy the example file
cp .env.example .dev.vars

# 2. Fill in your values
# 3. Never commit .dev.vars to version control
```

## Required Variables

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `OPENROUTER_API_KEY` | AI chat completions | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `GITHUB_CLIENT_ID` | GitHub OAuth | [github.com/settings/developers](https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | [github.com/settings/developers](https://github.com/settings/developers) |
| `GOOGLE_CLIENT_ID` | Google OAuth | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) |

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Email service | (disabled) |
| `STRIPE_SECRET_KEY` | Payment processing | (disabled) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks | (disabled) |
| `DOCKER_API_KEY` | Container management | (disabled) |
| `DOCKER_PROXY_URL` | Docker endpoint | (disabled) |
| `GEMINI_API_KEY` | Alternative AI | (disabled) |

## Cloudflare-Specific

| Variable | Description | Required for |
|----------|-------------|--------------|
| `CLOUDFLARE_API_TOKEN` | API access | Deployment |
| `CLOUDFLARE_ZONE_ID` | Zone identifier | WAF rules |

## Application Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_URL` | Application URL | `https://app.cyberaiuz.workers.dev` |
| `ENVIRONMENT` | Environment mode | `development` |

## Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_REGISTRATION` | Allow new signups | `true` |
| `ENABLE_CHAT` | Enable AI chat | `true` |
| `ENABLE_CONSOLE` | Enable terminal | `true` |
| `ENABLE_2FA` | Enable 2FA | `true` |

## Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_GLOBAL` | Global requests/min | `100` |
| `RATE_LIMIT_AUTH` | Auth attempts/min | `5` |
| `RATE_LIMIT_CHAT` | Chat requests/min | `20` |

## Security Notes

1. **Never commit** `.dev.vars` or `.env` to version control
2. **Use Cloudflare secrets** for production: `wrangler secret put <VAR>`
3. **Rotate keys** regularly
4. **Use test keys** for development (Stripe: `sk_test_*`)

## Troubleshooting

### Variable not working?

1. Check spelling (case-sensitive)
2. Restart dev server after changes
3. Verify in Cloudflare dashboard: Workers → Settings → Variables

### Production deployment?

```bash
# Set secrets via CLI
wrangler secret put OPENROUTER_API_KEY
wrangler secret put GITHUB_CLIENT_ID
# ... etc
```
