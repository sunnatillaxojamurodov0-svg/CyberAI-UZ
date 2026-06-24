# Staging Environment Guide

## Overview

Staging environment mirrors production for testing before deployment.

## Environments

| Environment | URL | Branch | Purpose |
|-------------|-----|--------|---------|
| Development | `localhost:5173` | feature/* | Local development |
| Staging | `app-staging.cyberaiuz.workers.dev` | develop | Pre-production testing |
| Production | `app.cyberaiuz.workers.dev` | main | Live environment |

## Staging vs Production

| Feature | Staging | Production |
|---------|---------|------------|
| Database | `cyberai-db-staging` | `cyberai-db` |
| KV | `staging-kv` | `cyberai-kv` |
| R2 | `cyberai-bucket-staging` | `cyberai-bucket` |
| Analytics | `cyberai_analytics_staging` | `cyberai_analytics` |
| Queue | `ai-usage-queue-staging` | `ai-usage-queue` |
| Vectorize | `cyberai-vectors-staging` | `cyberai-vectors` |
| Rate Limits | Same | Same |

## Deployment Flow

```
feature/* → develop (auto) → staging (auto) → main → production (manual)
```

### Automatic Deployments

1. **Push to `develop`** → Deploys to staging
2. **Merge to `main`** → Deploys to production

### Manual Deployments

```bash
# Deploy to staging
npx wrangler deploy --config wrangler.staging.jsonc

# Deploy to production
npx wrangler deploy
```

## Setup Staging Resources

```bash
# Create staging database
npx wrangler d1 create cyberai-db-staging

# Create staging KV
npx wrangler kv namespace create CYBERAI_KV --env staging

# Create staging R2 bucket
npx wrangler r2 bucket create cyberai-bucket-staging

# Create staging queue
npx wrangler queues create ai-usage-queue-staging
```

## Environment Variables

Staging uses the same secrets as production but with separate resources.

Set via Cloudflare Dashboard or CLI:
```bash
# Staging secrets
npx wrangler secret put OPENROUTER_API_KEY --config wrangler.staging.jsonc
npx wrangler secret put GITHUB_CLIENT_ID --config wrangler.staging.jsonc
# ... etc
```

## Testing Staging

```bash
# Test staging endpoint
curl https://app-staging.cyberaiuz.workers.dev/api/auth/me

# Test with staging config
npx wrangler dev --config wrangler.staging.jsonc
```

## Promoting to Production

1. Merge `develop` → `main`
2. CI/CD automatically deploys to production
3. Verify on production URL
