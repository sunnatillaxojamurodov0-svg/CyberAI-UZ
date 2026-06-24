# CyberAI — Autonomous Defense for the Synthetic Era

Sovereign AI cybersecurity platform for high-stakes infrastructure. Predictive threat intelligence, conversational defense, and autonomous remediation.

## Features

- **VAEL AI Assistant** — Advanced cybersecurity AI with multiple skill modes
- **CTF Challenges** — Interactive capture-the-flag challenges with scoring
- **Kali Linux Sandbox** — Browser-based terminal for hands-on practice
- **Leaderboard** — Community rankings and competition
- **Real-time Chat** — AI-powered conversational defense
- **Admin Panel** — Challenge management and moderation
- **2FA/MFA** — TOTP-based two-factor authentication
- **Dynamic Flags** — Per-user unique CTF flags

## Quick Start

### Prerequisites

- Node.js 18+
- npm or bun
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cyberai.git
cd cyberai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .dev.vars

# Start development server
npm run dev
```

### Environment Variables

See [docs/environment-variables.md](docs/environment-variables.md) for complete reference.

```bash
# Required
OPENROUTER_API_KEY="sk-or-v1-xxxx"
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Optional
RESEND_API_KEY="re_xxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxx"
```

## Usage

### Development

```bash
npm run dev          # Start dev server
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:load    # Run load tests
```

### Production

```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database

```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
npm run db:status    # Check migration status
```

## Deployment

### Cloudflare Workers

```bash
# Login to Cloudflare
wrangler login

# Deploy to staging
npx wrangler deploy --config wrangler.staging.jsonc

# Deploy to production
npx wrangler deploy

# Set secrets
wrangler secret put OPENROUTER_API_KEY
wrangler secret put GITHUB_CLIENT_ID
# ... etc
```

### Docker (Kali Sandbox)

```bash
cd docker-proxy
docker-compose up -d
```

See [docs/deployment.md](docs/deployment.md) for detailed instructions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare                           │
├─────────────────────────────────────────────────────────────┤
│  Workers (Edge)  │  D1 (SQLite)  │  KV (Cache)  │  R2 (Files)│
├─────────────────────────────────────────────────────────────┤
│  Queues          │  Vectorize    │  Analytics   │  AI        │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  TanStack Start (SSR)  │  React 19  │  TailwindCSS 4       │
├─────────────────────────────────────────────────────────────┤
│  Auth (2FA, OAuth)  │  AI (OpenRouter)  │  Payments (Stripe)│
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
cyberai/
├── src/
│   ├── routes/          # Pages and API endpoints
│   ├── components/      # UI components
│   ├── lib/             # Utilities and services
│   ├── durable-objects/ # WebSocket sessions
│   ├── workflows/       # Cloudflare Workflows
│   └── queues/          # Queue processors
├── drizzle/             # Database schema
├── migrations/          # SQL migrations
├── docker-proxy/        # Kali sandbox proxy
├── tests/               # Unit tests
├── e2e/                 # End-to-end tests
└── scripts/             # Build and utility scripts
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TanStack Router + TailwindCSS 4 |
| Backend | TanStack Start (SSR) + Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2, KV |
| AI | OpenRouter (GPT, Claude, Llama) |
| Auth | Custom (GitHub, Google OAuth, 2FA) |
| Payments | Stripe |
| Realtime | Durable Objects (WebSocket) |
| Queue | Cloudflare Queues |
| Container | Docker Proxy (Kali sandbox) |
| Monitoring | Sentry + Analytics Engine |

## API

See [docs/api.md](docs/api.md) for complete API reference.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/your-username/cyberai/issues)
- Email: support@cyberaiuz.workers.dev
