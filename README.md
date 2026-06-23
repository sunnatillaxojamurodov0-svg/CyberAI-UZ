# CyberAI — Autonomous Defense for the Synthetic Era

Sovereign AI cybersecurity platform for high-stakes infrastructure. Predictive threat intelligence, conversational defense, and autonomous remediation.

## Features

- **VAEL AI Assistant** — Advanced cybersecurity AI with multiple skill modes
- **CTF Challenges** — Interactive capture-the-flag challenges with scoring
- **Kali Linux Sandbox** — Browser-based terminal for hands-on practice
- **Leaderboard** — Community rankings and competition
- **Real-time Chat** — AI-powered conversational defense

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TanStack Router + TailwindCSS 4 |
| Backend | TanStack Start (SSR) + Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2, KV |
| AI | Google Generative AI, Cloudflare Workers AI |
| Auth | Custom (GitHub, Google OAuth) |
| Realtime | Durable Objects (WebSocket) |
| Queue | Cloudflare Queues |
| Container | Docker Proxy (Kali sandbox) |

## Getting Started

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
cp .dev.vars.example .dev.vars

# Start development server
npm run dev
```

### Environment Variables

```bash
# .dev.vars
OPENROUTER_API_KEY=your_openrouter_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Development

```bash
# Start dev server
npm run dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Deployment

### Cloudflare Workers

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run build
wrangler deploy
```

### Docker (for Kali sandbox)

```bash
cd docker-proxy

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
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
├── migrations/          # D1 database migrations
├── docker-proxy/        # Kali sandbox proxy
├── tests/               # Unit tests
└── e2e/                 # End-to-end tests
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message to VAEL AI |
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/register` | POST | Create account |
| `/api/auth/me` | GET | Get current user |
| `/api/billing` | GET | Get subscription info |
| `/api/billing` | POST | Create checkout session |
| `/api/webhooks/stripe` | POST | Stripe webhook |
| `/api/workflows` | POST | Trigger workflows |
| `/api/workflows` | GET | Get workflow status |

## Pricing

| Plan | Price | AI Messages | CTF Challenges |
|------|-------|-------------|----------------|
| Free | $0/mo | 50/day | 3/day |
| Pro | $19/mo | Unlimited | Unlimited |
| Enterprise | $99/mo | Unlimited | Unlimited |

## Security

- CSP headers enabled
- Rate limiting on API endpoints
- Session-based authentication
- SQL injection prevention
- XSS protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Support

- Documentation: [docs.cyberaiuz.workers.dev](https://docs.cyberaiuz.workers.dev)
- Issues: [GitHub Issues](https://github.com/your-username/cyberai/issues)
- Email: support@cyberaiuz.workers.dev
