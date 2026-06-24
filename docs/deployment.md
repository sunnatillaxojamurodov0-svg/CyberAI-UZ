# Deployment Guide

## Cloudflare Workers Deployment

### Prerequisites

1. Cloudflare account
2. Node.js 18+
3. Wrangler CLI installed

### Steps

```bash
# 1. Login to Cloudflare
wrangler login

# 2. Create D1 database
wrangler d1 create cyberai-db

# 3. Create KV namespace
wrangler kv namespace create CYBERAI_KV

# 4. Create R2 bucket
wrangler r2 bucket create cyberai-bucket

# 5. Run migrations
wrangler d1 execute cyberai-db --file=./migrations/0001_initial.sql
wrangler d1 execute cyberai-db --file=./migrations/0002_auth.sql
wrangler d1 execute cyberai-db --file=./migrations/0003_rate_limits_quota.sql
wrangler d1 execute cyberai-db --file=./migrations/0004_github_oauth.sql
wrangler d1 execute cyberai-db --file=./migrations/0005_google_oauth.sql
wrangler d1 execute cyberai-db --file=./migrations/0006_workflows.sql
wrangler d1 execute cyberai-db --file=./migrations/0007_leaderboard.sql
wrangler d1 execute cyberai-db --file=./migrations/0008_payments.sql

# 6. Set secrets
wrangler secret put OPENROUTER_API_KEY
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# 7. Deploy
npm run build
wrangler deploy
```

### Custom Domain

```bash
# Add custom domain
wrangler route add cyberaiuz.workers.dev/* app
```

## Docker Deployment (Kali Sandbox)

### Prerequisites

- Docker Desktop installed
- Docker API enabled on port 2375

### Steps

```bash
cd docker-proxy

# 1. Configure environment
cp .env.example .env
# Edit .env with your settings

# 2. Build and start
docker-compose up -d

# 3. Verify
docker-compose ps
curl http://localhost:2377/api/health
```

### Production Setup

```bash
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# View logs
docker-compose logs -f proxy

# Stop
docker-compose down
```

## CI/CD (GitHub Actions)

### Setup

1. Add repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `OPENROUTER_API_KEY`
   - `STRIPE_SECRET_KEY`

2. Push to `main` branch triggers deployment

### Workflow

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

## Environment Variables

| Variable                | Required | Description                |
| ----------------------- | -------- | -------------------------- |
| `OPENROUTER_API_KEY`    | Yes      | OpenRouter API key for AI  |
| `GITHUB_CLIENT_ID`      | Yes      | GitHub OAuth client ID     |
| `GITHUB_CLIENT_SECRET`  | Yes      | GitHub OAuth client secret |
| `GOOGLE_CLIENT_ID`      | Yes      | Google OAuth client ID     |
| `GOOGLE_CLIENT_SECRET`  | Yes      | Google OAuth client secret |
| `STRIPE_SECRET_KEY`     | Yes      | Stripe secret key          |
| `STRIPE_WEBHOOK_SECRET` | Yes      | Stripe webhook secret      |

## Monitoring

### Cloudflare Dashboard

- Workers → Observability
- D1 → Queries
- Queues → Messages

### Logs

```bash
# Tail worker logs
wrangler tail

# View D1 queries
wrangler d1 execute cyberai-db --command "SELECT * FROM users LIMIT 10"
```

## Troubleshooting

### Build Errors

```bash
# Clear cache
rm -rf node_modules .wrangler dist
npm install
npm run build
```

### D1 Errors

```bash
# Reset database
wrangler d1 execute cyberai-db --command "DROP TABLE IF EXISTS users"
# Re-run migrations
```

### Docker Errors

```bash
# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
