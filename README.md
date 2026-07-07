# CyberAI — Cybersecurity Learning Platform

> Real cybersecurity training with real tools, real terminals, and real challenges.

## What is CyberAI?

CyberAI is a cybersecurity learning platform that provides:

- **Real Kali Linux terminals** — Not simulations, actual containers
- **70+ CTF challenges** — From beginner to insane difficulty
- **AI assistant (VAEL)** — Helps you learn without spoiling
- **Live leaderboard** — Compete with other hackers
- **Profile system** — Track your progress and achievements

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, xterm.js
- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Sandbox**: Docker containers with Kali Linux
- **AI**: OpenRouter API (Gemini, Claude, GPT)
- **Infrastructure**: Oracle Cloud Free Tier ($0/month)

## Quick Start

```bash
# Clone
git clone https://github.com/yourusername/cyberai-uz.git
cd cyberai-uz

# Install
npm install

# Run
npm run dev
```

## Documentation

| Document                                | Description            |
| --------------------------------------- | ---------------------- |
| [Master Spec](docs/00_MASTER_SPEC.md)   | Source of truth        |
| [Plan](docs/02_PLAN.md)                 | Implementation roadmap |
| [Architecture](docs/03_ARCHITECTURE.md) | System design          |
| [API](docs/05_API.md)                   | REST + WebSocket API   |
| [Database](docs/06_DATABASE.md)         | Schema and migrations  |
| [Sandbox](docs/07_SANDBOX.md)           | Container lifecycle    |
| [Security](docs/09_SECURITY.md)         | Threat model           |
| [Deployment](docs/10_DEPLOYMENT.md)     | Oracle Cloud setup     |

## Architecture

```
Browser ←WebSocket→ Backend ←WebSocket→ Sandbox Service ←Docker→ Kali Container
```

## Contributing

See [Contributing Guide](docs/20_CONTRIBUTING.md).

## License

MIT
